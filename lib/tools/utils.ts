import type { ToolResult } from "@/lib/runtime/tools";

export type ToolParams = Record<string, unknown>;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function getString(params: ToolParams, key: string) {
  const value = params[key];

  if (typeof value !== "string") {
    throw new Error(`Esperava string em ${key}.`);
  }

  return value;
}

export function getOptionalString(params: ToolParams, key: string) {
  const value = params[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Esperava string em ${key}.`);
  }

  return value;
}

export function getNumber(params: ToolParams, key: string) {
  const value = params[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Esperava numero em ${key}.`);
  }

  return value;
}

export function getOptionalNumber(params: ToolParams, key: string) {
  const value = params[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Esperava numero em ${key}.`);
  }

  return value;
}

export function getBoolean(params: ToolParams, key: string) {
  const value = params[key];

  if (typeof value !== "boolean") {
    throw new Error(`Esperava boolean em ${key}.`);
  }

  return value;
}

export function getStringArray(params: ToolParams, key: string) {
  const value = params[key];

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Esperava array de strings em ${key}.`);
  }

  return value;
}

export function getOptionalStringArray(params: ToolParams, key: string) {
  const value = params[key];

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Esperava array de strings em ${key}.`);
  }

  return value;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${numberFormatter.format(value)}%`;
}

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function createPrefixedId(prefix: string) {
  const timestamp = Date.now().toString().slice(-8);
  const randomChunk = Math.floor(Math.random() * 9000 + 1000).toString();

  return `${prefix}-${timestamp}-${randomChunk}`;
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buildDisplay(title: string, lines: string[]) {
  return [title, ...lines].join("\n");
}

export function okResult(data: unknown, display: string): ToolResult {
  return {
    success: true,
    data,
    display,
  };
}
