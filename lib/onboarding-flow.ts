export const ONBOARDING_SEGMENTS = [
  "Servicos",
  "Comercio",
  "Saude",
  "Educacao",
  "Tecnologia",
  "Industria",
  "Outro",
] as const;

export const ONBOARDING_SIZES = [
  "So eu",
  "2-5",
  "6-20",
  "20+",
] as const;

export const ONBOARDING_TICKET_RANGES = [
  "Ate R$500",
  "R$500-2.000",
  "R$2.000-10.000",
  "R$10.000+",
] as const;

export const ONBOARDING_WHATSAPP_INTENTS = ["later", "now"] as const;
export const ONBOARDING_TONE_IDS = [
  "professional",
  "friendly",
  "consultative",
  "fast",
] as const;

export type OnboardingSegment = (typeof ONBOARDING_SEGMENTS)[number];
export type OnboardingSize = (typeof ONBOARDING_SIZES)[number];
export type OnboardingTicketRange = (typeof ONBOARDING_TICKET_RANGES)[number];
export type OnboardingWhatsAppIntent =
  (typeof ONBOARDING_WHATSAPP_INTENTS)[number];

export const ONBOARDING_TONES = [
  {
    id: "professional",
    emoji: "💼",
    label: "Profissional e direta",
    shortLabel: "Profissional",
    description: "Fala com clareza, postura comercial e foco na proxima acao.",
    preview:
      "Oi! Sou a Frya da {company}. Vi seu interesse em {product}. Posso te fazer 2 perguntas rapidas para entender se faz sentido para voce?",
  },
  {
    id: "friendly",
    emoji: "😊",
    label: "Amigavel e proxima",
    shortLabel: "Amigavel",
    description: "Tom caloroso, facil de responder e bem natural no WhatsApp.",
    preview:
      "Oi! Que bom te ver por aqui :) Sou a Frya da {company}. Me conta rapidinho o que voce procura e eu te guio no melhor caminho.",
  },
  {
    id: "consultative",
    emoji: "🎓",
    label: "Consultiva e educativa",
    shortLabel: "Consultiva",
    description: "Explica o contexto, ensina e conduz a conversa com criterio.",
    preview:
      "Oi! Sou a Frya da {company}. Antes de te indicar a melhor opcao, quero entender seu momento e o que voce quer resolver com {product}.",
  },
  {
    id: "fast",
    emoji: "⚡",
    label: "Rapida e objetiva",
    shortLabel: "Rapida",
    description: "Vai ao ponto e reduz o tempo entre interesse e qualificacao.",
    preview:
      "Oi! Sou a Frya da {company}. Pra eu te direcionar rapido: o que voce busca hoje em {product}?",
  },
] as const;

export type OnboardingToneId = (typeof ONBOARDING_TONE_IDS)[number];

export interface OnboardingSetupFormValues {
  companyName: string;
  product: string;
  segment: OnboardingSegment | "";
  size: OnboardingSize | "";
  icp: string;
  mainPain: string;
  averageTicket: OnboardingTicketRange | "";
  toneId: OnboardingToneId | "";
  whatsappIntent: OnboardingWhatsAppIntent;
}

export interface OnboardingSetupValidationErrors {
  companyName?: string;
  product?: string;
  segment?: string;
  size?: string;
  icp?: string;
  mainPain?: string;
  averageTicket?: string;
  toneId?: string;
}

export interface ValidatedOnboardingSetupData {
  companyName: string;
  product: string;
  segment: OnboardingSegment;
  size: OnboardingSize;
  icp: string;
  mainPain: string;
  averageTicket: OnboardingTicketRange;
  toneId: OnboardingToneId;
  whatsappIntent: OnboardingWhatsAppIntent;
}

export function createEmptyOnboardingSetupValues(): OnboardingSetupFormValues {
  return {
    companyName: "",
    product: "",
    segment: "",
    size: "",
    icp: "",
    mainPain: "",
    averageTicket: "",
    toneId: "",
    whatsappIntent: "later",
  };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? normalizeText(value) : "";
}

function pickEnumValue<const T extends readonly string[]>(
  record: Record<string, unknown>,
  key: string,
  options: T,
): T[number] | "" {
  const value = pickString(record, key);

  return options.includes(value) ? (value as T[number]) : "";
}

export function sanitizeOnboardingSetupInput(
  input: unknown,
): OnboardingSetupFormValues {
  if (!isRecord(input)) {
    return createEmptyOnboardingSetupValues();
  }

  const whatsappIntent = pickEnumValue(
    input,
    "whatsappIntent",
    ONBOARDING_WHATSAPP_INTENTS,
  );

  return {
    companyName: pickString(input, "companyName"),
    product: pickString(input, "product"),
    segment: pickEnumValue(input, "segment", ONBOARDING_SEGMENTS),
    size: pickEnumValue(input, "size", ONBOARDING_SIZES),
    icp: pickString(input, "icp"),
    mainPain: pickString(input, "mainPain"),
    averageTicket: pickEnumValue(
      input,
      "averageTicket",
      ONBOARDING_TICKET_RANGES,
    ),
    toneId: pickEnumValue(
      input,
      "toneId",
      ONBOARDING_TONE_IDS,
    ),
    whatsappIntent: whatsappIntent || "later",
  };
}

function validateRequiredText(
  value: string,
  label: string,
  minLength: number,
  maxLength: number,
) {
  if (!value) {
    return `${label} e obrigatorio.`;
  }

  if (value.length < minLength) {
    return `${label} precisa ter pelo menos ${minLength} caracteres.`;
  }

  if (value.length > maxLength) {
    return `${label} precisa ter no maximo ${maxLength} caracteres.`;
  }

  return undefined;
}

export function validateOnboardingStep(
  step: number,
  input: unknown,
): OnboardingSetupValidationErrors {
  const values = sanitizeOnboardingSetupInput(input);
  const errors: OnboardingSetupValidationErrors = {};

  if (step === 0) {
    errors.companyName = validateRequiredText(
      values.companyName,
      "Nome da empresa",
      2,
      80,
    );
    errors.product = validateRequiredText(
      values.product,
      "O que voce vende",
      3,
      160,
    );

    if (!values.segment) {
      errors.segment = "Selecione o segmento.";
    }

    if (!values.size) {
      errors.size = "Selecione o tamanho da empresa.";
    }
  }

  if (step === 1) {
    errors.icp = validateRequiredText(
      values.icp,
      "Pra quem voce vende",
      8,
      220,
    );
    errors.mainPain = validateRequiredText(
      values.mainPain,
      "Maior dor do cliente",
      8,
      220,
    );

    if (!values.averageTicket) {
      errors.averageTicket = "Selecione o ticket medio.";
    }
  }

  if (step === 2 && !values.toneId) {
    errors.toneId = "Selecione o tom da Frya.";
  }

  return errors;
}

export function isOnboardingStepComplete(
  step: number,
  input: unknown,
) {
  return Object.values(validateOnboardingStep(step, input)).every(
    (value) => !value,
  );
}

export function validateOnboardingSetupData(input: unknown):
  | {
      success: true;
      data: ValidatedOnboardingSetupData;
    }
  | {
      success: false;
      errors: OnboardingSetupValidationErrors;
    } {
  const values = sanitizeOnboardingSetupInput(input);
  const stepErrors = [0, 1, 2].reduce<OnboardingSetupValidationErrors>(
    (accumulator, step) => ({
      ...accumulator,
      ...validateOnboardingStep(step, values),
    }),
    {},
  );

  if (Object.values(stepErrors).some(Boolean)) {
    return {
      success: false,
      errors: stepErrors,
    };
  }

  return {
    success: true,
    data: {
      companyName: values.companyName,
      product: values.product,
      segment: values.segment as OnboardingSegment,
      size: values.size as OnboardingSize,
      icp: values.icp,
      mainPain: values.mainPain,
      averageTicket: values.averageTicket as OnboardingTicketRange,
      toneId: values.toneId as OnboardingToneId,
      whatsappIntent: values.whatsappIntent,
    },
  };
}

export function getOnboardingTone(toneId: OnboardingToneId | "") {
  return ONBOARDING_TONES.find((tone) => tone.id === toneId) ?? null;
}

export function findToneIdByLabel(label: string | null | undefined) {
  const normalizedLabel = normalizeText(label ?? "").toLowerCase();

  const tone = ONBOARDING_TONES.find(
    (entry) => entry.label.toLowerCase() === normalizedLabel,
  );

  return tone?.id ?? null;
}

export function formatTonePreview(
  toneId: OnboardingToneId | "",
  values: Pick<OnboardingSetupFormValues, "companyName" | "product">,
) {
  const tone = getOnboardingTone(toneId);

  if (!tone) {
    return "";
  }

  const company = values.companyName || "sua empresa";
  const product = values.product || "sua solucao";

  return tone.preview
    .replaceAll("{company}", company)
    .replaceAll("{product}", product);
}
