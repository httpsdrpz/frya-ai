import "server-only";

import { formatCurrency } from "@/lib/onboarding-quiz";
import type { BusinessProduct, BusinessTone, SalePaymentStatus } from "@/src/db/types";
import type { AgentContext, RouterDispatchResult } from "@/src/agents/types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseClaudeJson<T>(value: string): T | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const directJson = trimmed.startsWith("{") ? trimmed : null;
  const matchedJson = trimmed.match(/\{[\s\S]*\}/)?.[0] ?? null;

  for (const candidate of [directJson, matchedJson]) {
    if (!candidate) {
      continue;
    }

    try {
      return JSON.parse(candidate) as T;
    } catch {
      continue;
    }
  }

  return null;
}

export function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value
      .replace(/[R$\s]/g, "")
      .replace(/\.(?=\d{3}(?:\D|$))/g, "")
      .replace(",", ".");
    const parsed = Number.parseFloat(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function asInteger(value: unknown) {
  const parsed = asNumber(value);

  if (parsed === null) {
    return null;
  }

  return Math.max(1, Math.round(parsed));
}

export function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export function toNumericString(value: number) {
  return value.toFixed(2);
}

export function parseNumericDbValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function mapSalePaymentStatus(value: unknown): SalePaymentStatus {
  const normalized = asString(value)?.toLowerCase();

  switch (normalized) {
    case "pending":
    case "pendente":
      return "pending";
    case "overdue":
    case "atrasado":
    case "vencido":
      return "overdue";
    default:
      return "paid";
  }
}

export function toneReply(
  tone: BusinessTone | null | undefined,
  variants: Record<BusinessTone, string>,
) {
  const resolvedTone = tone ?? "casual";
  return variants[resolvedTone];
}

function normalizeComparableText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreCandidateProduct(input: string, candidate: string) {
  const normalizedInput = normalizeComparableText(input);
  const normalizedCandidate = normalizeComparableText(candidate);

  if (!normalizedInput || !normalizedCandidate) {
    return 0;
  }

  if (normalizedInput === normalizedCandidate) {
    return 1;
  }

  if (
    normalizedCandidate.includes(normalizedInput) ||
    normalizedInput.includes(normalizedCandidate)
  ) {
    return 0.88;
  }

  const inputTokens = new Set(normalizedInput.split(" "));
  const candidateTokens = new Set(normalizedCandidate.split(" "));
  const sharedTokens = [...inputTokens].filter((token) => candidateTokens.has(token));
  const tokenScore = sharedTokens.length / Math.max(inputTokens.size, candidateTokens.size);

  const charSet = new Set(normalizedInput);
  const sharedChars = [...new Set(normalizedCandidate)].filter((char) => charSet.has(char));
  const charScore = sharedChars.length / Math.max(normalizedInput.length, normalizedCandidate.length);

  return tokenScore * 0.75 + charScore * 0.25;
}

export function fuzzyMatchBusinessProduct(
  input: string | null,
  products: BusinessProduct[] | undefined,
) {
  if (!input || !products?.length) {
    return null;
  }

  let bestMatch: { product: BusinessProduct; score: number } | null = null;

  for (const product of products) {
    const score = scoreCandidateProduct(input, product.name);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { product, score };
    }
  }

  if (!bestMatch || bestMatch.score < 0.52) {
    return null;
  }

  return bestMatch;
}

export function logHandlerEvent(
  context: Pick<
    AgentContext,
    "tenant" | "customerPhone" | "intent" | "message"
  >,
  event: string,
  data?: Record<string, unknown>,
) {
  console.info(
    JSON.stringify({
      scope: "frya-handler",
      event,
      tenantId: context.tenant.id,
      tenantName: context.tenant.name,
      intent: context.intent,
      customerPhone: context.customerPhone,
      messageId: context.message.messageId,
      ...data,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function handlerErrorResult(
  context: AgentContext,
  error: unknown,
): RouterDispatchResult {
  logHandlerEvent(context, "handler_error", {
    error: error instanceof Error ? error.message : String(error),
  });

  return {
    intent: context.intent,
    confidence: context.confidence,
    actionExecuted: false,
    responseText: toneReply(context.businessProfile?.tone, {
      formal:
        "Tive um problema ao concluir essa acao agora. Pode me enviar novamente em instantes?",
      casual:
        "Deu um probleminha aqui pra concluir isso agora. Me manda de novo em instantes?",
      tecnico:
        "Falha de execucao do handler. Consulte os logs estruturados do tenant.",
    }),
    extracted: context.extractedData,
  };
}

export function buildMissingFieldsReply(
  context: AgentContext,
  fields: {
    product?: boolean;
    totalValue?: boolean;
    paymentMethod?: boolean;
    customerName?: boolean;
    dueDate?: boolean;
    scheduledAt?: boolean;
  },
  snapshot?: {
    productName?: string | null;
    totalValue?: number | null;
    customerName?: string | null;
  },
) {
  if (fields.paymentMethod && snapshot?.totalValue !== null && snapshot?.totalValue !== undefined) {
    return toneReply(context.businessProfile?.tone, {
      formal: `Anotei a venda de ${formatCurrency(snapshot.totalValue)}. Qual foi a forma de pagamento?`,
      casual: `Ja anotei ${formatCurrency(snapshot.totalValue)}. Como o cliente pagou?`,
      tecnico: `Dados pendentes para concluir a venda: paymentMethod. Valor capturado: ${formatCurrency(snapshot.totalValue)}.`,
    });
  }

  if (fields.customerName && snapshot?.totalValue !== null && snapshot?.totalValue !== undefined) {
    return toneReply(context.businessProfile?.tone, {
      formal: `Anotei a venda de ${formatCurrency(snapshot.totalValue)}. Para qual cliente devo registrar?`,
      casual: `Show, ja peguei ${formatCurrency(snapshot.totalValue)}. Foi venda pra quem?`,
      tecnico: `Dados pendentes para concluir a venda: customerName. Valor capturado: ${formatCurrency(snapshot.totalValue)}.`,
    });
  }

  if (fields.product) {
    return toneReply(context.businessProfile?.tone, {
      formal: "Perfeito. Qual produto ou servico devo registrar?",
      casual: "Fechou. O que voce vendeu exatamente?",
      tecnico: "Campo obrigatorio ausente: productOrService.",
    });
  }

  if (fields.totalValue) {
    return toneReply(context.businessProfile?.tone, {
      formal: "Perfeito. Qual foi o valor dessa operacao?",
      casual: "Boa. Qual foi o valor dessa venda?",
      tecnico: "Campo obrigatorio ausente: totalValue.",
    });
  }

  if (fields.dueDate) {
    return toneReply(context.businessProfile?.tone, {
      formal: "Qual e a data de vencimento dessa cobranca?",
      casual: "Quando essa cobranca vence?",
      tecnico: "Campo obrigatorio ausente: dueDate.",
    });
  }

  if (fields.scheduledAt) {
    return toneReply(context.businessProfile?.tone, {
      formal: "Qual e a data e o horario desse compromisso?",
      casual: "Me fala a data e o horario certinho que eu marco.",
      tecnico: "Campo obrigatorio ausente: scheduledAt.",
    });
  }

  return toneReply(context.businessProfile?.tone, {
    formal: "Preciso de mais alguns dados para concluir essa acao.",
    casual: "Preciso de mais um detalhezinho pra fechar isso.",
    tecnico: "Dados insuficientes para concluir a acao.",
  });
}
