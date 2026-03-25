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

export function createCsAgent(company: CompanyProfile): AgentDefinition {
  const readiness =
    66 +
    Math.min(company.currentTools.length * 5, 10) +
    (company.goals.some((goal) => /atendimento|retencao|suporte/i.test(goal))
      ? 16
      : 8);

  return {
    id: "cs",
    name: "Frya CS",
    sector: "Experiencia",
    description:
      "Centraliza atendimento, organiza handoffs e protege a experiencia do cliente no pos-venda.",
    objective: `Reduzir tempo de resposta e elevar satisfacao dos clientes da ${company.businessName} com automacao assistida.`,
    tone: "Empatico, resolutivo e claro.",
    status: deriveStatus(readiness),
    readiness,
    channels: company.salesChannels.length
      ? [...company.salesChannels]
      : ["WhatsApp", "Email"],
    tools: ["Base de conhecimento", "Help desk", ...company.currentTools].slice(
      0,
      5,
    ),
    checklist: [
      "Definir SLA por canal e prioridade.",
      "Mapear duvidas recorrentes e macros de resposta.",
      "Configurar trilhas de onboarding e reativacao.",
    ],
    metrics: [
      "Tempo medio de primeira resposta",
      "Tickets resolvidos no primeiro contato",
      "Clientes reativados ou retidos",
    ],
    capabilities: [
      {
        title: "Triagem inteligente",
        description:
          "Classifica urgencia, tema e probabilidade de escalonamento antes do atendimento humano.",
      },
      {
        title: "Respostas guiadas",
        description:
          "Sugere proximos passos e mensagens alinhadas ao tom da marca.",
      },
      {
        title: "Deteccao de risco",
        description:
          "Sinaliza churn, atrasos de onboarding e clientes sem interacao recente.",
      },
    ],
  };
}

export function replyAsCs(message: string, company: CompanyProfile) {
  const text = message.toLowerCase();

  if (text.includes("sla") || text.includes("tempo")) {
    return "Eu estruturaria filas por urgencia e canal, com SLA separado para comercial, suporte e financeiro. Isso ja reduz gargalos sem aumentar a equipe.";
  }

  if (text.includes("churn") || text.includes("cancel")) {
    return `Para ${company.businessName}, vale ativar um fluxo de risco com alertas de silencio, reclamacoes recorrentes e queda de uso.`;
  }

  if (text.includes("onboarding") || text.includes("implant")) {
    return "Posso sugerir uma trilha de onboarding com checkpoints automatizados, resumo de pendencias e aviso para o time quando houver bloqueio.";
  }

  return "Minha prioridade seria centralizar contexto do cliente, padronizar respostas e criar gatilhos de escalonamento quando houver risco ou atraso.";
}
