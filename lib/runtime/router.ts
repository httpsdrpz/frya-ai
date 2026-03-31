import { registerTool } from "@/lib/runtime/tools";
import {
  buildDisplay,
  normalizeText,
  okResult,
} from "@/lib/tools/utils";
import type { AgentKey } from "@/types";

const routeKeywords: Record<AgentKey, string[]> = {
  sdr: [
    "lead",
    "pipeline",
    "follow",
    "qualific",
    "reuniao",
    "proposta",
    "closer",
  ],
  cs: [
    "ticket",
    "suporte",
    "cancel",
    "churn",
    "cliente",
    "faq",
    "reclam",
  ],
  financeiro: [
    "boleto",
    "pix",
    "pagamento",
    "fatura",
    "invoice",
    "inadimpl",
    "cobranca",
  ],
  marketing: [
    "campanha",
    "copy",
    "conteudo",
    "anuncio",
    "ads",
    "instagram",
    "calendario",
  ],
};

export function detectRouteFromMessage(message: string): AgentKey | null {
  const normalized = normalizeText(message);
  let bestMatch: AgentKey | null = null;
  let bestScore = 0;

  for (const [agentType, keywords] of Object.entries(routeKeywords) as Array<
    [AgentKey, string[]]
  >) {
    const score = keywords.reduce(
      (total, keyword) => total + (normalized.includes(keyword) ? 1 : 0),
      0,
    );

    if (score > bestScore) {
      bestScore = score;
      bestMatch = agentType;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

registerTool({
  agents: ["*"],
  definition: {
    name: "handoff_to_agent",
    description:
      "Encaminha o contexto para outro agente especializado quando o assunto sair da sua area.",
    parameters: {
      target_agent: {
        type: "string",
        description: "Agente de destino para o handoff.",
        enum: ["sdr", "cs", "financeiro", "marketing"],
      },
      reason: {
        type: "string",
        description: "Motivo do handoff.",
      },
      context_summary: {
        type: "string",
        description: "Resumo do contexto que precisa ser transferido.",
      },
    },
    requiredParams: ["target_agent", "reason", "context_summary"],
  },
  handler: (params, context) => {
    const targetAgent = String(params.target_agent);
    const reason = String(params.reason);
    const contextSummary = String(params.context_summary);

    const display = buildDisplay("Handoff preparado.", [
      `Destino: ${targetAgent}`,
      `Motivo: ${reason}`,
      `Resumo: ${contextSummary}`,
    ]);

    return okResult(
      {
        fromAgent: context.agentType,
        targetAgent,
        reason,
        contextSummary,
        recommendedMessage: `Encaminhar para ${targetAgent} com o resumo informado.`,
      },
      display,
    );
  },
});

registerTool({
  agents: ["*"],
  definition: {
    name: "get_company_context",
    description:
      "Recupera uma nota sobre o contexto da empresa ja disponivel no system prompt.",
    parameters: {},
    requiredParams: [],
  },
  handler: (_params, context) =>
    okResult(
      {
        companyId: context.companyId,
        note: "O contexto da empresa ja esta presente no system prompt deste agente.",
      },
      "O contexto da empresa ja esta no system prompt; use essas informacoes na resposta.",
    ),
});
