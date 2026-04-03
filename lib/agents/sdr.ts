import type { AgentDefinition, CompanyProfile } from "@/types";

function deriveStatus(readiness: number): AgentDefinition["status"] {
  if (readiness >= 85) {
    return "active";
  }

  if (readiness >= 70) {
    return "configuring";
  }

  return "draft";
}

export function createSdrAgent(company: CompanyProfile): AgentDefinition {
  const readiness =
    64 +
    Math.min(company.salesChannels.length * 7, 14) +
    (company.goals.some((goal) => /lead|venda|pipeline/i.test(goal)) ? 15 : 6);

  return {
    id: "sdr",
    name: "Frya",
    sector: "Receita",
    description:
      "Qualifica leads, distribui oportunidades e conduz follow-ups com contexto de negocio.",
    objective: `Acelerar a geracao de pipeline para ${company.businessName} com abordagem consultiva e cadencias multicanal.`,
    tone: "Consultivo, agil e orientado a conversao.",
    status: deriveStatus(readiness),
    readiness,
    channels: company.salesChannels.length
      ? [...company.salesChannels]
      : ["WhatsApp", "Email", "Instagram"],
    tools: ["CRM", "WhatsApp", "Calendario", ...company.currentTools].slice(0, 5),
    checklist: [
      "Definir ICP e principais dores por segmento.",
      "Mapear cadencia de contato e handoff para vendas.",
      "Preparar respostas para objecoes e qualificacao.",
    ],
    metrics: [
      "Leads qualificados por semana",
      "Taxa de resposta por canal",
      "Reunioes agendadas",
    ],
    capabilities: [
      {
        title: "Qualificacao automatizada",
        description:
          "Faz perguntas de contexto, prioriza urgencia e identifica fit antes do repasse.",
      },
      {
        title: "Follow-up multicanal",
        description:
          "Mantem contato em janelas estrategicas para reduzir perda de oportunidade.",
      },
      {
        title: "Resumo para o time comercial",
        description:
          "Entrega historico, objecoes e sinais de compra antes da reuniao.",
      },
    ],
  };
}

export function replyAsSdr(message: string, company: CompanyProfile) {
  const text = message.toLowerCase();

  if (text.includes("lead") || text.includes("qualific")) {
    return `Posso estruturar um fluxo de qualificacao para ${company.businessName} com perguntas sobre porte, urgencia e canal de entrada. Assim filtramos melhor os leads antes do handoff.`;
  }

  if (text.includes("whatsapp") || text.includes("cadencia")) {
    return "Sugiro uma cadencia em 3 toques: resposta inicial em ate 5 minutos, follow-up consultivo no mesmo dia e retomada com prova social no dia seguinte.";
  }

  if (text.includes("objec") || text.includes("preco")) {
    return "Posso montar um playbook de objecoes com foco em ROI, prazo de ativacao e comparativo com o processo manual atual.";
  }

  return `Minha recomendacao inicial para ${company.businessName} e organizar entrada, qualificacao e proximo passo em um unico fluxo. Isso costuma aumentar velocidade comercial sem perder contexto.`;
}
