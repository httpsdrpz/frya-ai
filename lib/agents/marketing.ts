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

export function createMarketingAgent(company: CompanyProfile): AgentDefinition {
  const readiness =
    62 +
    Math.min(company.salesChannels.length * 5, 15) +
    (company.goals.some((goal) => /marketing|conteudo|demanda|social/i.test(goal))
      ? 17
      : 7);

  return {
    id: "marketing",
    name: "Frya Marketing",
    sector: "Demanda",
    description:
      "Organiza campanhas, calendario editorial e mensagens para gerar demanda com consistencia.",
    objective: `Gerar mais demanda qualificada para ${company.businessName} com conteudo, campanhas e distribuicao alinhados ao ICP.`,
    tone: company.tone ?? "Criativo, objetivo e alinhado a marca.",
    status: deriveStatus(readiness),
    readiness,
    channels: company.salesChannels.length
      ? [...company.salesChannels]
      : ["Instagram", "WhatsApp", "Email"],
    tools: ["CRM", "Meta Ads", "Calendario editorial", ...company.currentTools].slice(
      0,
      5,
    ),
    checklist: [
      "Definir ICP, proposta de valor e angulos de campanha.",
      "Organizar calendario de conteudo e rotina de distribuicao.",
      "Configurar testes de criativo e mensagens por canal.",
    ],
    metrics: [
      "Leads gerados por campanha",
      "Custo por lead",
      "Taxa de resposta inicial",
    ],
    capabilities: [
      {
        title: "Planejamento de conteudo",
        description:
          "Cria pautas, ganchos e sequencias de publicacao alinhadas ao posicionamento da empresa.",
      },
      {
        title: "Mensagens para campanha",
        description:
          "Gera copys para anuncios, landing pages e WhatsApp com foco em conversao.",
      },
      {
        title: "Otimizacao de demanda",
        description:
          "Ajuda a ajustar canais, criativos e ofertas com base na resposta do mercado.",
      },
    ],
  };
}

export function replyAsMarketing(message: string, company: CompanyProfile) {
  const text = message.toLowerCase();

  if (text.includes("conteudo") || text.includes("calend")) {
    return `Posso montar um calendario editorial para ${company.businessName} com temas que eduquem o ICP e puxem a conversa para o comercial.`;
  }

  if (text.includes("campanha") || text.includes("anuncio") || text.includes("trafego")) {
    return "Minha sugestao e separar campanhas por dor principal, com uma oferta clara, prova social e CTA direto para o canal de maior resposta.";
  }

  if (text.includes("instagram") || text.includes("social")) {
    return "Podemos estruturar uma rotina de posts e stories com ganchos curtos, objecoes frequentes e convites para conversa no WhatsApp.";
  }

  return `Eu priorizaria um posicionamento simples para ${company.businessName}, com mensagens consistentes por canal e campanhas focadas no ICP que voce quer atrair.`;
}
