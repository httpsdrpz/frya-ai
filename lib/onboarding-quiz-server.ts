import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { companies, users } from "@/db/schema";
import { db } from "@/lib/db";
import {
  ONBOARDING_ACTION_OPTIONS,
  ONBOARDING_TONE_OPTIONS,
  createEmptyOnboardingQuizValues,
  normalizeBrazilianPhone,
  resolveSegmentValue,
  sanitizeOnboardingQuizInput,
  type OnboardingActionType,
  type OnboardingQuizData,
  type OnboardingQuizFormInput,
} from "@/lib/onboarding-quiz";
import { actionSchemas, businessProfiles, tenants } from "@/src/db";

interface PersistOnboardingQuizArgs {
  userId: string;
  email: string;
  name?: string | null;
  data: OnboardingQuizData;
}

function averageProductPrice(products: OnboardingQuizData["products"]) {
  if (!products.length) {
    return null;
  }

  const total = products.reduce((sum, product) => sum + product.price, 0);
  return (total / products.length).toFixed(2);
}

function buildLegacyMainPain(actions: OnboardingActionType[]) {
  const labels = actions
    .map((action) => ONBOARDING_ACTION_OPTIONS.find((option) => option.value === action))
    .filter((option): option is (typeof ONBOARDING_ACTION_OPTIONS)[number] => Boolean(option))
    .map((option) => option.title.toLowerCase());

  if (!labels.length) {
    return "Organizar a operacao pelo WhatsApp.";
  }

  return `Quer que a Frya assuma tarefas como ${labels.join(", ")}.`;
}

function serializeRawOnboarding(data: OnboardingQuizData) {
  return JSON.stringify({
    source: "frya-onboarding-quiz-v2",
    businessName: data.businessName,
    whatsappNumber: data.whatsappNumber,
    segment: data.segment,
    otherSegment: data.otherSegment,
    products: data.products,
    paymentMethods: data.paymentMethods,
    actions: data.actions,
    tone: data.tone,
    completedAt: new Date().toISOString(),
  });
}

export function getOnboardingQuizInitialValues(
  company:
    | {
        name: string;
        segment: string | null;
        product: string | null;
        tone: string | null;
        rawOnboarding: string | null;
      }
    | null,
): OnboardingQuizFormInput {
  if (!company) {
    return createEmptyOnboardingQuizValues();
  }

  if (company.rawOnboarding) {
    try {
      return sanitizeOnboardingQuizInput(JSON.parse(company.rawOnboarding));
    } catch {
      return sanitizeOnboardingQuizInput({
        businessName: company.name,
        segment: company.segment ?? "",
        product: company.product ?? "",
        tone: company.tone ?? "",
      });
    }
  }

  return sanitizeOnboardingQuizInput({
    businessName: company.name,
    segment: company.segment ?? "",
    product: company.product ?? "",
    tone: company.tone ?? "",
  });
}

export async function persistOnboardingQuiz({
  userId,
  email,
  name,
  data,
}: PersistOnboardingQuizArgs) {
  const segment = resolveSegmentValue(data);
  const tenantTone =
    ONBOARDING_TONE_OPTIONS.find((option) => option.value === data.tone)?.value ??
    "casual";
  const toneLabel =
    ONBOARDING_TONE_OPTIONS.find((option) => option.value === data.tone)?.label ??
    "Casual";
  const rawOnboarding = serializeRawOnboarding(data);
  const normalizedWhatsApp = normalizeBrazilianPhone(data.whatsappNumber);

  await db
    .insert(users)
    .values({
      id: userId,
      email,
      name: name ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        name: name ?? null,
      },
    });

  const existingCompany = (
    await db
      .select()
      .from(companies)
      .where(eq(companies.userId, userId))
      .limit(1)
  )[0];

  const tenantId = existingCompany?.id ?? randomUUID();
  const existingTenant = (
    await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  )[0];

  const tenantPayload = {
    id: tenantId,
    name: data.businessName,
    segment,
    whatsappNumber: normalizedWhatsApp,
    plan: "free" as const,
    onboardingCompleted: true,
  };

  if (existingTenant) {
    await db.update(tenants).set(tenantPayload).where(eq(tenants.id, tenantId));
  } else {
    await db.insert(tenants).values(tenantPayload);
  }

  const businessProfilePayload = {
    tenantId,
    businessName: data.businessName,
    segment,
    products: data.products.map((product) => ({
      name: product.name,
      price: product.price,
      description: "",
    })),
    paymentMethods: data.paymentMethods,
    averageTicket: averageProductPrice(data.products),
    salesChannels: ["whatsapp"],
    workingHours: null,
    tone: tenantTone,
    customInstructions: null,
  };

  const existingBusinessProfile = (
    await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.tenantId, tenantId))
      .limit(1)
  )[0];

  if (existingBusinessProfile) {
    await db
      .update(businessProfiles)
      .set(businessProfilePayload)
      .where(eq(businessProfiles.tenantId, tenantId));
  } else {
    await db.insert(businessProfiles).values(businessProfilePayload);
  }

  const existingActionSchemas = await db
    .select()
    .from(actionSchemas)
    .where(eq(actionSchemas.tenantId, tenantId));
  const actionSchemaByType = new Map(
    existingActionSchemas.map((action) => [action.actionType, action]),
  );
  const enabledActions = new Set(data.actions);
  const allActionTypes = [
    ...ONBOARDING_ACTION_OPTIONS.map((option) => option.value),
    "custom",
  ] as const;

  for (const actionType of allActionTypes) {
    const option = ONBOARDING_ACTION_OPTIONS.find(
      (entry) => entry.value === actionType,
    );
    const isEnabled = enabledActions.has(actionType as OnboardingActionType);
    const payload = {
      tenantId,
      actionType,
      isEnabled,
      config: option
        ? {
            icon: option.icon,
            title: option.title,
            description: option.description,
            source: "onboarding_quiz",
          }
        : {
            title: "Custom",
            description: "Fluxo personalizado desativado por padrao.",
            source: "onboarding_quiz",
          },
    };

    if (actionSchemaByType.has(actionType)) {
      await db
        .update(actionSchemas)
        .set(payload)
        .where(eq(actionSchemas.id, actionSchemaByType.get(actionType)!.id));
    } else {
      await db.insert(actionSchemas).values(payload);
    }
  }

  const companyPayload = {
    userId,
    name: data.businessName,
    segment,
    size: "SMB",
    mainPain: buildLegacyMainPain(data.actions),
    icp: "Clientes atendidos e operados via WhatsApp.",
    product: data.products.map((product) => product.name).join(", "),
    tone: toneLabel,
    rawOnboarding,
    onboardingCompleted: true,
  };

  if (existingCompany) {
    await db
      .update(companies)
      .set(companyPayload)
      .where(eq(companies.id, existingCompany.id));
  } else {
    await db.insert(companies).values({
      id: tenantId,
      ...companyPayload,
    });
  }

  return {
    tenantId,
  };
}
