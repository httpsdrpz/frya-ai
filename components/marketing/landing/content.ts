export const heroPills = [
  "Responde em segundos",
  "Faz follow-up sozinho",
  "Protege o caixa",
];

export const leakCards = [
  {
    label: "Lead entrou",
    value: "09:12",
    copy: "Chegou quente. Pronto para falar.",
  },
  {
    label: "Primeiro silencio",
    value: "+11 min",
    copy: "O interesse caiu antes do primeiro retorno.",
  },
  {
    label: "Receita perdida",
    value: "R$ 1.840",
    copy: "Uma venda comum que saiu para quem respondeu antes.",
  },
];

export const automationCards = [
  {
    title: "Resposta imediata",
    copy: "Frya atende na hora, sem fila e sem depender de alguem online.",
  },
  {
    title: "Proximo passo claro",
    copy: "Horario, contexto e intencao ficam organizados na mesma conversa.",
  },
  {
    title: "Follow-up no tempo certo",
    copy: "Se o lead sumir, o sistema volta antes da oportunidade esfriar.",
  },
];

export const operatingMetrics = [
  {
    label: "Tempo medio de resposta",
    value: "9s",
  },
  {
    label: "Retornos esquecidos",
    value: "0",
  },
  {
    label: "Conversas reativadas hoje",
    value: "18",
  },
];

export const operatingNotes = [
  "Sem planilha paralela.",
  "Sem lembrar quem sumiu.",
  "Sem abrir o WhatsApp o dia inteiro.",
];

export const heroPreviewStats = [
  {
    label: "Resposta media",
    value: "9s",
  },
  {
    label: "Follow-ups hoje",
    value: "18",
  },
];

export const conversationScript = [
  {
    id: "lead-message",
    role: "lead" as const,
    text: "Oi, ainda tem horario pra sexta?",
  },
  {
    id: "frya-message-1",
    role: "frya" as const,
    text: "Tem sim. Posso te mandar os horarios livres agora.",
  },
  {
    id: "frya-message-2",
    role: "frya" as const,
    text: "Se preferir, te lembro mais tarde pra nao perder o horario.",
  },
];
