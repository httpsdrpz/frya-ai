import "server-only";

import { cache } from "react";
import { and, eq } from "drizzle-orm";
import type { Company } from "@/db/schema";
import { agents, companies, users } from "@/db/schema";
import { db } from "@/lib/db";
import {
  findToneIdByLabel,
  getOnboardingTone,
  sanitizeOnboardingSetupInput,
  type OnboardingSetupFormValues,
  type ValidatedOnboardingSetupData,
} from "@/lib/onboarding-flow";
import { buildSystemPrompt, companyContextFromOnboarding } from "@/lib/prompts/builder";
import { getCompanyByUserId } from "@/lib/queries";

interface PersistOnboardingSetupArgs {
  userId: string;
  email: string;
  name?: string | null;
  data: ValidatedOnboardingSetupData;
}

function serializeRawOnboarding(data: ValidatedOnboardingSetupData) {
  const tone = getOnboardingTone(data.toneId);

  return JSON.stringify({
    ...data,
    tone: tone?.label ?? "Profissional e direta",
    completedAt: new Date().toISOString(),
  });
}

function getPromptContext(data: ValidatedOnboardingSetupData) {
  const tone = getOnboardingTone(data.toneId);

  return companyContextFromOnboarding({
    name: data.companyName,
    segment: data.segment,
    size: data.size,
    mainPain: data.mainPain,
    icp: data.icp,
    product: data.product,
    tone: tone?.label ?? "Profissional e direta",
    suggestedAgents: ["sdr"],
  });
}

function buildAgentConfig(data: ValidatedOnboardingSetupData) {
  const tone = getOnboardingTone(data.toneId);

  return {
    onboardingData: {
      ...data,
      tone: tone?.label ?? "Profissional e direta",
    },
    whatsapp: {
      intent: data.whatsappIntent,
      status: data.whatsappIntent === "now" ? "coming_soon" : "skipped",
    },
  };
}

function parseRawOnboarding(rawOnboarding: string | null | undefined) {
  if (!rawOnboarding) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawOnboarding) as unknown;
    return sanitizeOnboardingSetupInput(parsed);
  } catch {
    return null;
  }
}

export function getOnboardingInitialValues(
  company: Company | null,
): OnboardingSetupFormValues {
  const rawValues = parseRawOnboarding(company?.rawOnboarding);

  if (rawValues) {
    return rawValues;
  }

  if (!company) {
    return sanitizeOnboardingSetupInput({});
  }

  return sanitizeOnboardingSetupInput({
    companyName: company.name,
    product: company.product ?? "",
    segment: company.segment ?? "",
    size: company.size ?? "",
    icp: company.icp ?? "",
    mainPain: company.mainPain ?? "",
    toneId: findToneIdByLabel(company.tone),
  });
}

export const getOnboardingStateByUserId = cache(async (userId: string) => {
  try {
    const company = await getCompanyByUserId(userId);

    return {
      company,
      completed: company?.onboardingCompleted ?? false,
      redirectTo: company?.onboardingCompleted ? "/dashboard" : "/onboarding",
    };
  } catch {
    return {
      company: null,
      completed: false,
      redirectTo: "/onboarding",
    };
  }
});

export async function persistOnboardingSetup({
  userId,
  email,
  name,
  data,
}: PersistOnboardingSetupArgs) {
  const promptContext = getPromptContext(data);
  const rawOnboarding = serializeRawOnboarding(data);
  const tone = getOnboardingTone(data.toneId);

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

  const existingCompany = await getCompanyByUserId(userId);
  const companyPayload = {
    userId,
    name: data.companyName,
    segment: data.segment,
    size: data.size,
    mainPain: data.mainPain,
    icp: data.icp,
    product: data.product,
    tone: tone?.label ?? "Profissional e direta",
    rawOnboarding,
    onboardingCompleted: true,
  };

  const company = existingCompany
    ? (
        await db
          .update(companies)
          .set(companyPayload)
          .where(eq(companies.id, existingCompany.id))
          .returning()
      )[0]
    : (
        await db
          .insert(companies)
          .values(companyPayload)
          .returning()
      )[0];

  const systemPrompt = buildSystemPrompt("sdr", promptContext);
  const agentConfig = buildAgentConfig(data);
  const existingSdr = (
    await db
      .select()
      .from(agents)
      .where(and(eq(agents.userId, userId), eq(agents.type, "sdr")))
      .limit(1)
  )[0];

  const agent = existingSdr
    ? (
        await db
          .update(agents)
          .set({
            companyId: company.id,
            userId,
            type: "sdr",
            name: "Frya",
            status: "active",
            systemPrompt,
            config: agentConfig,
            updatedAt: new Date(),
          })
          .where(eq(agents.id, existingSdr.id))
          .returning()
      )[0]
    : (
        await db
          .insert(agents)
          .values({
            companyId: company.id,
            userId,
            type: "sdr",
            name: "Frya",
            status: "active",
            systemPrompt,
            config: agentConfig,
          })
          .returning()
      )[0];

  return { company, agent };
}
