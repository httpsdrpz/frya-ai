import type {
  AgentState,
  LeadClassification,
  LeadSource,
  LeadStatus,
} from "@/types";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

export function formatAgentState(state: AgentState) {
  switch (state) {
    case "active":
      return "Ativo";
    case "configuring":
      return "Configurando";
    case "draft":
      return "Rascunho";
    default:
      return state;
  }
}

export function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function formatList(items: string[]) {
  if (!items.length) {
    return "Ainda nao definido";
  }

  return new Intl.ListFormat("pt-BR", {
    style: "long",
    type: "conjunction",
  }).format(items);
}

export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "R$ 0,00";
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(numericValue)) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatMonthLabel(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatTime(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatRelativeTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Sem contato";
  }

  const parsed = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(parsed.getTime())) {
    return "Sem contato";
  }

  const diffMs = parsed.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, "day");
  }

  const diffWeeks = Math.round(diffDays / 7);
  return formatter.format(diffWeeks, "week");
}

export function formatTenantPlan(plan: string | null | undefined) {
  switch (plan) {
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    case "free":
      return "Free";
    default:
      return plan ?? "-";
  }
}

export function formatSalePaymentStatus(status: string | null | undefined) {
  switch (status) {
    case "pending":
      return "Pendente";
    case "paid":
      return "Pago";
    case "overdue":
      return "Atrasado";
    default:
      return status ?? "-";
  }
}

export function formatCollectionStatus(status: string | null | undefined) {
  switch (status) {
    case "pending":
      return "Pendente";
    case "sent":
      return "Enviada";
    case "paid":
      return "Paga";
    case "overdue":
      return "Atrasada";
    default:
      return status ?? "-";
  }
}

export function formatAppointmentStatus(status: string | null | undefined) {
  switch (status) {
    case "scheduled":
      return "Agendado";
    case "completed":
      return "Concluido";
    case "cancelled":
      return "Cancelado";
    default:
      return status ?? "-";
  }
}

export function formatDocumentType(type: string | null | undefined) {
  switch (type) {
    case "nf":
      return "NF";
    case "cupom":
      return "Cupom";
    case "comprovante":
      return "Comprovante";
    case "contrato":
      return "Contrato";
    case "outro":
      return "Outro";
    default:
      return type ?? "-";
  }
}

export function formatBusinessTone(tone: string | null | undefined) {
  switch (tone) {
    case "formal":
      return "Formal";
    case "casual":
      return "Casual";
    case "tecnico":
      return "Tecnico";
    default:
      return tone ?? "-";
  }
}

export function formatLeadStatus(status: LeadStatus) {
  switch (status) {
    case "novo":
      return "Novo";
    case "qualificado":
      return "Qualificado";
    case "reuniao":
      return "Reuniao";
    case "negociacao":
      return "Negociacao";
    case "fechado":
      return "Fechado";
    case "perdido":
      return "Perdido";
    default:
      return status;
  }
}

export function formatLeadClassification(classification: LeadClassification) {
  switch (classification) {
    case "hot":
      return "Hot";
    case "warm":
      return "Warm";
    case "cold":
      return "Cold";
    case "unscored":
      return "Sem score";
    default:
      return classification;
  }
}

export function formatLeadSource(source: LeadSource) {
  switch (source) {
    case "whatsapp":
      return "WhatsApp";
    case "instagram":
      return "Instagram";
    case "email":
      return "Email";
    case "site":
      return "Site";
    case "manual":
      return "Manual";
    default:
      return source;
  }
}
