import type { AgentState } from "@/types";

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
