import "server-only";

import { eq } from "drizzle-orm";
import { callClaude } from "@/lib/claude";
import { db } from "@/lib/db";
import { actionSchemas, businessProfiles, tenants } from "@/src/db";
import type { ActionSchema, ActionType } from "@/src/db/types";
import { getHandler } from "@/src/agents/handlers";
import {
  asString,
  isRecord,
  parseClaudeJson,
  toneReply,
} from "@/src/agents/handlers/shared";
import type {
  AgentContext,
  IntentClassification,
  ProcessedWhatsAppMessage,
  RouterActionType,
  RouterDispatchResult,
} from "@/src/agents/types";
import { RouterIntent } from "@/src/agents/types";
import { sendDocument, sendMessage } from "@/src/services/whatsapp";

const ROUTER_SYSTEM_PROMPT = `Voce e o roteador do Frya AI, um secretario digital para pequenos negocios.
Analise a mensagem do usuario e classifique a intencao.

Intencoes possiveis:
- SALE_REGISTER: usuario quer registrar uma venda (ex: "vendi 3 camisetas por 150 reais pro Joao")
- DOCUMENT_STORE: usuario enviou ou quer armazenar NF/cupom/comprovante (ex: "guarda essa nota" + imagem)
- COLLECTION_TRACK: usuario quer registrar/consultar cobranca (ex: "o Joao ta devendo 200 reais desde dia 5")
- APPOINTMENT_SCHEDULE: usuario quer agendar algo (ex: "marca reuniao com fornecedor quinta 14h")
- REPORT_REQUEST: usuario quer um relatorio (ex: "como ta meu mes?", "quanto vendi essa semana?")
- GENERAL_CHAT: conversa geral, duvida, ou algo que nao se encaixa

Responda APENAS com um JSON:
{ "intent": "SALE_REGISTER", "confidence": 0.95, "extracted": { ... dados extraidos da mensagem } }`;

const INTENT_TO_ACTION: Partial<Record<RouterIntent, RouterActionType>> = {
  [RouterIntent.SALE_REGISTER]: "sale_register",
  [RouterIntent.DOCUMENT_STORE]: "document_store",
  [RouterIntent.COLLECTION_TRACK]: "collection_track",
  [RouterIntent.APPOINTMENT_SCHEDULE]: "appointment_schedule",
  [RouterIntent.REPORT_REQUEST]: "report_generate",
};

interface BaseTenantContext {
  tenant: import("@/src/db/types").Tenant;
  businessProfile: import("@/src/db/types").BusinessProfile | null;
  actionSchemas: ActionSchema[];
  actionMap: Partial<Record<ActionType, ActionSchema>>;
}

function inferIntentFallback(
  message: ProcessedWhatsAppMessage,
): IntentClassification {
  const content = message.messageContent.toLowerCase();

  if (
    message.messageType === "document" ||
    message.messageType === "image" ||
    /\b(nota|nf|cupom|comprovante|contrato)\b/i.test(content)
  ) {
    return {
      intent: RouterIntent.DOCUMENT_STORE,
      confidence: 0.56,
      extracted: {},
    };
  }

  if (/\b(vendi|venda|fechei|recebi)\b/i.test(content)) {
    return {
      intent: RouterIntent.SALE_REGISTER,
      confidence: 0.58,
      extracted: {},
    };
  }

  if (/\b(devendo|cobranc|cobra|vence|vencimento|boleto)\b/i.test(content)) {
    return {
      intent: RouterIntent.COLLECTION_TRACK,
      confidence: 0.57,
      extracted: {},
    };
  }

  if (/\b(agenda|agendar|marcar|reuniao|consulta|quinta|sexta|\d{1,2}h)\b/i.test(content)) {
    return {
      intent: RouterIntent.APPOINTMENT_SCHEDULE,
      confidence: 0.56,
      extracted: {},
    };
  }

  if (/\b(relatorio|como ta|quanto vendi|essa semana|meu mes|fatur)\b/i.test(content)) {
    return {
      intent: RouterIntent.REPORT_REQUEST,
      confidence: 0.55,
      extracted: {},
    };
  }

  return {
    intent: RouterIntent.GENERAL_CHAT,
    confidence: 0.35,
    extracted: {},
  };
}

async function loadBaseTenantContext(tenantId: string): Promise<BaseTenantContext> {
  const [tenantRows, businessProfileRows, actionSchemaRows] = await Promise.all([
    db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1),
    db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.tenantId, tenantId))
      .limit(1),
    db.select().from(actionSchemas).where(eq(actionSchemas.tenantId, tenantId)),
  ]);

  const tenant = tenantRows[0];

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} nao encontrado para roteamento.`);
  }

  const actionMap = Object.fromEntries(
    actionSchemaRows.map((action) => [action.actionType, action]),
  ) as Partial<Record<ActionType, ActionSchema>>;

  return {
    tenant,
    businessProfile: businessProfileRows[0] ?? null,
    actionSchemas: actionSchemaRows,
    actionMap,
  };
}

async function classifyIntent(
  message: ProcessedWhatsAppMessage,
  baseContext: BaseTenantContext,
): Promise<IntentClassification> {
  const payload = {
    messageType: message.messageType,
    phoneNumber: message.phoneNumber,
    pushName: message.pushName,
    messageContent: message.messageContent,
    mediaUrl: message.mediaUrl ?? null,
    tenantSegment:
      baseContext.businessProfile?.segment ?? baseContext.tenant.segment ?? null,
    tenantProducts:
      baseContext.businessProfile?.products.map((product) => product.name) ?? [],
    paymentMethods: baseContext.businessProfile?.paymentMethods ?? [],
  };

  try {
    const response = await callClaude(
      [
        {
          role: "user",
          content: JSON.stringify(payload, null, 2),
        },
      ],
      ROUTER_SYSTEM_PROMPT,
      350,
    );
    const parsed = parseClaudeJson<IntentClassification>(response);

    if (
      parsed &&
      Object.values(RouterIntent).includes(parsed.intent) &&
      typeof parsed.confidence === "number" &&
      isRecord(parsed.extracted)
    ) {
      return parsed;
    }
  } catch (error) {
    console.error("Falha ao classificar intencao do WhatsApp:", error);
  }

  return inferIntentFallback(message);
}

function buildAgentContext(
  message: ProcessedWhatsAppMessage,
  baseContext: BaseTenantContext,
  classification: IntentClassification,
): AgentContext {
  return {
    tenant: baseContext.tenant,
    businessProfile: baseContext.businessProfile,
    actionSchemas: baseContext.actionSchemas,
    actionMap: baseContext.actionMap,
    customerPhone: message.phoneNumber,
    customerName:
      asString(classification.extracted.customerName) ?? message.pushName ?? null,
    extractedData: classification.extracted,
    message,
    intent: classification.intent,
    confidence: classification.confidence,
  };
}

function isActionEnabled(context: AgentContext) {
  const actionType = INTENT_TO_ACTION[context.intent];

  if (!actionType) {
    return true;
  }

  return context.actionMap[actionType]?.isEnabled ?? true;
}

function buildActionDisabledResult(context: AgentContext): RouterDispatchResult {
  return {
    intent: context.intent,
    confidence: context.confidence,
    actionExecuted: false,
    blockedReason: "action_disabled",
    responseText: toneReply(context.businessProfile?.tone, {
      formal:
        "Essa automacao esta desativada no momento. Posso te orientar a reativar no painel da Frya.",
      casual:
        "Essa funcao ta desligada aqui agora. Se quiser, ativa no painel da Frya e eu sigo com voce.",
      tecnico:
        `Intent ${context.intent} bloqueada: acao correspondente desativada em ActionSchemas.`,
    }),
    extracted: context.extractedData,
  };
}

function buildGeneralChatResult(context: AgentContext): RouterDispatchResult {
  const enabledActions = context.actionSchemas
    .filter((action) => action.isEnabled)
    .map((action) => {
      switch (action.actionType) {
        case "sale_register":
          return "registrar vendas";
        case "document_store":
          return "guardar documentos";
        case "collection_track":
          return "acompanhar cobrancas";
        case "appointment_schedule":
          return "agendar compromissos";
        case "report_generate":
          return "montar relatorios";
        default:
          return null;
      }
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  return {
    intent: context.intent,
    confidence: context.confidence,
    actionExecuted: false,
    responseText: toneReply(context.businessProfile?.tone, {
      formal:
        `Posso ajudar com operacoes do WhatsApp como ${enabledActions.join(", ") || "registro de vendas e documentos"}.`,
      casual:
        `Tamo junto. Posso te ajudar com ${enabledActions.join(", ") || "vendas, documentos e cobrancas"} pelo WhatsApp.`,
      tecnico:
        `GENERAL_CHAT. Acoes habilitadas: ${enabledActions.join(", ") || "nenhuma listada"}.`,
    }),
    extracted: context.extractedData,
  };
}

async function deliverRouterResult(
  context: AgentContext,
  result: RouterDispatchResult,
) {
  if (result.responseText) {
    await sendMessage(context.customerPhone, result.responseText, {
      tenantId: context.tenant.id,
    });
  }

  if (result.responseDocument) {
    await sendDocument(
      context.customerPhone,
      result.responseDocument.fileUrl,
      result.responseDocument.caption,
      {
        tenantId: context.tenant.id,
        fileName: result.responseDocument.fileName,
      },
    );
  }
}

export async function routeIncomingMessage(
  message: ProcessedWhatsAppMessage,
): Promise<RouterDispatchResult> {
  const baseContext = await loadBaseTenantContext(message.tenantId);
  const classification = await classifyIntent(message, baseContext);
  const context = buildAgentContext(message, baseContext, classification);

  console.info(
    JSON.stringify({
      scope: "frya-router",
      event: "message_classified",
      tenantId: context.tenant.id,
      tenantName: context.tenant.name,
      customerPhone: context.customerPhone,
      intent: context.intent,
      confidence: context.confidence,
      messageId: context.message.messageId,
      timestamp: new Date().toISOString(),
    }),
  );

  let result: RouterDispatchResult;

  if (!isActionEnabled(context)) {
    result = buildActionDisabledResult(context);
  } else {
    const handler = getHandler(context.intent);
    result = handler ? await handler.handle(context) : buildGeneralChatResult(context);
  }

  await deliverRouterResult(context, result);

  return result;
}
