import { z } from "zod";

export const ONBOARDING_SEGMENT_OPTIONS = [
  { value: "Loja/Varejo", label: "Loja / Varejo" },
  { value: "Servicos", label: "Servicos" },
  { value: "Alimentacao", label: "Alimentacao" },
  { value: "Saude/Beleza", label: "Saude / Beleza" },
  { value: "Educacao", label: "Educacao" },
  { value: "Outro", label: "Outro" },
] as const;

export const ONBOARDING_PAYMENT_METHOD_OPTIONS = [
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartao de Credito" },
  { value: "cartao_debito", label: "Cartao de Debito" },
  { value: "boleto", label: "Boleto" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "link_pagamento", label: "Link de pagamento" },
] as const;

export const ONBOARDING_ACTION_OPTIONS = [
  {
    value: "sale_register",
    icon: "📊",
    title: "Registrar vendas",
    description: "Anota cada venda com valor, cliente e pagamento",
  },
  {
    value: "document_store",
    icon: "📄",
    title: "Organizar notas fiscais",
    description: "Recebe NF/cupom e armazena tudo organizado",
  },
  {
    value: "collection_track",
    icon: "💰",
    title: "Controlar cobrancas",
    description: "Lembra de cobrancas pendentes e avisa voce",
  },
  {
    value: "appointment_schedule",
    icon: "📅",
    title: "Agendar compromissos",
    description: "Marca reunioes, entregas e follow-ups",
  },
  {
    value: "report_generate",
    icon: "📈",
    title: "Gerar relatorios",
    description: "Responde 'como ta meu mes?' com dados reais",
  },
] as const;

export const ONBOARDING_TONE_OPTIONS = [
  {
    value: "formal",
    label: "Formal",
    preview: "Bom dia, Sr. Joao. Sua venda de R$ 450 foi registrada.",
  },
  {
    value: "casual",
    label: "Casual",
    preview: "E ai Joao! Anotei a venda de 450 reais 👍",
  },
  {
    value: "tecnico",
    label: "Tecnico",
    preview: "Venda #127 registrada. Valor: R$450,00. Status: pendente.",
  },
] as const;

export type OnboardingSegmentChoice =
  (typeof ONBOARDING_SEGMENT_OPTIONS)[number]["value"];
export type OnboardingPaymentMethod =
  (typeof ONBOARDING_PAYMENT_METHOD_OPTIONS)[number]["value"];
export type OnboardingActionType =
  (typeof ONBOARDING_ACTION_OPTIONS)[number]["value"];
export type OnboardingTone = (typeof ONBOARDING_TONE_OPTIONS)[number]["value"];

const SEGMENT_VALUES = ONBOARDING_SEGMENT_OPTIONS.map((option) => option.value);
const PAYMENT_METHOD_VALUES = ONBOARDING_PAYMENT_METHOD_OPTIONS.map(
  (option) => option.value,
);
const ACTION_VALUES = ONBOARDING_ACTION_OPTIONS.map((option) => option.value);
const TONE_VALUES = ONBOARDING_TONE_OPTIONS.map((option) => option.value);

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function pickString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? normalizeText(value) : "";
}

function pickArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T[] {
  if (!isStringArray(value)) {
    return [];
  }

  return value.filter((item): item is T => allowed.includes(item as T));
}

function pickSegmentChoice(value: string) {
  if (SEGMENT_VALUES.includes(value as OnboardingSegmentChoice)) {
    return value as OnboardingSegmentChoice;
  }

  return value ? "Outro" : "";
}

function inferTone(value: string) {
  const normalized = value.toLowerCase();

  if (TONE_VALUES.includes(value as OnboardingTone)) {
    return value as OnboardingTone;
  }

  if (normalized.includes("formal")) {
    return "formal";
  }

  if (
    normalized.includes("casual") ||
    normalized.includes("amigavel") ||
    normalized.includes("proxima")
  ) {
    return "casual";
  }

  if (
    normalized.includes("tecnico") ||
    normalized.includes("consultiv") ||
    normalized.includes("rapida")
  ) {
    return "tecnico";
  }

  return "";
}

export function normalizeBrazilianPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 13);

  if (
    digits.startsWith("55") &&
    (digits.length === 12 || digits.length === 13)
  ) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function isValidBrazilianPhone(value: string) {
  const normalized = normalizeBrazilianPhone(value);

  return (
    normalized.startsWith("55") &&
    (normalized.length === 12 || normalized.length === 13)
  );
}

export function formatBrazilianPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 13);
  const localDigits =
    digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;

  if (!localDigits) {
    return "";
  }

  if (localDigits.length <= 2) {
    return `(${localDigits}`;
  }

  if (localDigits.length <= 6) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2)}`;
  }

  if (localDigits.length <= 10) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(
      2,
      localDigits.length - 4,
    )}-${localDigits.slice(-4)}`;
  }

  return `(${localDigits.slice(0, 2)}) ${localDigits.slice(
    2,
    7,
  )}-${localDigits.slice(7, 11)}`;
}

export function formatCurrencyInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (!digits) {
    return "";
  }

  const cents = digits.padStart(3, "0");
  const integerPart = cents.slice(0, -2);
  const decimalPart = cents.slice(-2);
  const formattedInteger = new Intl.NumberFormat("pt-BR").format(
    Number(integerPart),
  );

  return `${formattedInteger},${decimalPart}`;
}

export function parseCurrencyInput(value: string | number) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const digits = onlyDigits(value);

  if (!digits) {
    return null;
  }

  return Number(digits) / 100;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const priceSchema = z.union([z.number(), z.string()]).transform((value, context) => {
  const parsed = parseCurrencyInput(value);

  if (parsed === null || parsed < 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe um preco valido.",
    });
    return z.NEVER;
  }

  return parsed;
});

const actionSchema = z.string().refine(
  (value): value is OnboardingActionType =>
    ACTION_VALUES.includes(value as OnboardingActionType),
  "Selecione uma acao valida.",
);

const paymentMethodSchema = z.string().refine(
  (value): value is OnboardingPaymentMethod =>
    PAYMENT_METHOD_VALUES.includes(value as OnboardingPaymentMethod),
  "Selecione uma forma de pagamento valida.",
);

const toneSchema = z.string().refine(
  (value): value is OnboardingTone =>
    TONE_VALUES.includes(value as OnboardingTone),
  "Selecione um tom de voz valido.",
);

export const onboardingQuizSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(2, "Informe o nome do negocio.")
      .max(80, "Use no maximo 80 caracteres."),
    whatsappNumber: z
      .string()
      .trim()
      .min(1, "Informe seu WhatsApp.")
      .refine(isValidBrazilianPhone, "Informe um WhatsApp brasileiro valido."),
    segment: z
      .string()
      .trim()
      .min(1, "Escolha o segmento do seu negocio.")
      .refine(
        (value): value is OnboardingSegmentChoice =>
          SEGMENT_VALUES.includes(value as OnboardingSegmentChoice),
        "Escolha um segmento valido.",
      ),
    otherSegment: z
      .string()
      .trim()
      .max(60, "Use no maximo 60 caracteres.")
      .optional()
      .default(""),
    products: z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .min(2, "Informe o nome do item.")
            .max(80, "Use no maximo 80 caracteres."),
          price: priceSchema,
        }),
      )
      .min(1, "Adicione pelo menos um produto ou servico."),
    paymentMethods: z
      .array(paymentMethodSchema)
      .min(1, "Selecione pelo menos uma forma de pagamento."),
    actions: z
      .array(actionSchema)
      .min(1, "Selecione pelo menos uma tarefa do secretario."),
    tone: toneSchema,
  })
  .superRefine((value, context) => {
    if (value.segment === "Outro" && !value.otherSegment.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherSegment"],
        message: "Descreva o segmento do negocio.",
      });
    }
  });

export type OnboardingQuizFormInput = z.input<typeof onboardingQuizSchema>;
export type OnboardingQuizData = z.output<typeof onboardingQuizSchema>;

export function createEmptyOnboardingQuizValues(): OnboardingQuizFormInput {
  return {
    businessName: "",
    whatsappNumber: "",
    segment: "",
    otherSegment: "",
    products: [{ name: "", price: "" }],
    paymentMethods: [],
    actions: [],
    tone: "",
  };
}

export function sanitizeOnboardingQuizInput(
  input: unknown,
): OnboardingQuizFormInput {
  const fallback = createEmptyOnboardingQuizValues();

  if (!isRecord(input)) {
    return fallback;
  }

  const rawSegment = pickString(input, "segment");
  const productFallback = pickString(input, "product");
  const products = Array.isArray(input.products)
    ? input.products
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }

          const name = pickString(item, "name");
          const rawPrice = item.price;

          return {
            name,
            price:
              typeof rawPrice === "number"
                ? formatCurrencyInput(String(Math.round(rawPrice * 100)))
                : typeof rawPrice === "string"
                  ? formatCurrencyInput(rawPrice)
                  : "",
          };
        })
        .filter(
          (item): item is { name: string; price: string } => item !== null,
        )
    : [];

  const normalizedProducts = products.length
    ? products
    : productFallback
      ? [{ name: productFallback, price: "" }]
      : fallback.products;

  const segment = pickSegmentChoice(rawSegment);

  return {
    businessName:
      pickString(input, "businessName") ||
      pickString(input, "companyName") ||
      pickString(input, "name"),
    whatsappNumber: formatBrazilianPhone(
      pickString(input, "whatsappNumber") || pickString(input, "whatsapp"),
    ),
    segment,
    otherSegment: segment === "Outro" && rawSegment !== "Outro" ? rawSegment : "",
    products: normalizedProducts,
    paymentMethods: pickArray(
      input.paymentMethods,
      PAYMENT_METHOD_VALUES,
    ),
    actions: pickArray(input.actions, ACTION_VALUES),
    tone:
      inferTone(pickString(input, "tone")) ||
      (pickString(input, "tone") as OnboardingTone | ""),
  };
}

export function resolveSegmentValue(
  values: Pick<OnboardingQuizFormInput, "segment" | "otherSegment">,
) {
  return values.segment === "Outro"
    ? normalizeText(values.otherSegment ?? "")
    : values.segment;
}

export function getToneOption(value: string) {
  return ONBOARDING_TONE_OPTIONS.find((option) => option.value === value) ?? null;
}

export function getActionOption(value: string) {
  return ONBOARDING_ACTION_OPTIONS.find((option) => option.value === value) ?? null;
}

export function getPaymentMethodLabel(value: string) {
  return (
    ONBOARDING_PAYMENT_METHOD_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}
