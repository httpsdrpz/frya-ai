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

export function createFinanceiroAgent(company: CompanyProfile): AgentDefinition {
  const readiness =
    60 +
    Math.min(company.currentTools.length * 6, 12) +
    (company.goals.some((goal) => /financeiro|cobranca|inadimplencia/i.test(goal))
      ? 18
      : 9);

  return {
    id: "financeiro",
    name: "Frya Financeiro",
    sector: "Recebimento",
    description:
      "Cuida de cobranca preventiva, acompanhamento de pagamentos e organizacao do fluxo financeiro.",
    objective: `Diminuir inadimplencia e acelerar recebimento da ${company.businessName} com rotinas automatizadas.`,
    tone: "Firme, cordial e orientado a previsibilidade.",
    status: deriveStatus(readiness),
    readiness,
    channels: ["Email", "WhatsApp", "Portal do cliente"],
    tools: ["ERP", "Gateway de pagamento", ...company.currentTools].slice(0, 5),
    checklist: [
      "Mapear eventos de vencimento e atraso.",
      "Definir mensagens por faixa de inadimplencia.",
      "Integrar cobranca com status de contrato e renovacao.",
    ],
    metrics: [
      "Titulos pagos no prazo",
      "Recuperacao de inadimplencia",
      "Tempo medio ate recebimento",
    ],
    capabilities: [
      {
        title: "Cobranca preventiva",
        description:
          "Dispara lembretes antes do vencimento com orientacao clara de pagamento.",
      },
      {
        title: "Negociacao assistida",
        description:
          "Sugere proximos passos para acordos, segunda via e renegociacao.",
      },
      {
        title: "Visibilidade operacional",
        description:
          "Resume carteira em atraso e prioriza contas com maior risco.",
      },
    ],
  };
}

export function replyAsFinanceiro(message: string, company: CompanyProfile) {
  const text = message.toLowerCase();

  if (text.includes("inadimpl")) {
    return `Posso organizar uma regua de cobranca para ${company.businessName} com lembrete preventivo, aviso no vencimento e retomada com proposta de acordo quando necessario.`;
  }

  if (text.includes("boleto") || text.includes("pix") || text.includes("pagamento")) {
    return "Uma boa base e separar mensagens por meio de pagamento, incluir segunda via automatica e escalar apenas casos com risco real.";
  }

  if (text.includes("renegoci")) {
    return "Posso montar um fluxo com regras de concessao, historico de contato e sinalizacao para aprovacao humana quando o desconto fugir do limite.";
  }

  return "Minha sugestao inicial e ligar vencimento, recebimento e recontato em uma unica regua. Isso reduz esquecimentos e tira peso operacional do time financeiro.";
}
