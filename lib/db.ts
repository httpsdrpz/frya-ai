import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import type { DatabaseHealth, OnboardingAnalysis } from "@/types";

export const databaseConfig = {
  provider: "neon" as const,
  orm: "drizzle" as const,
  connectionString: process.env.DATABASE_URL ?? "",
};

function hasUsableDatabaseUrl(connectionString: string) {
  return (
    connectionString.startsWith("postgresql://") &&
    !connectionString.includes("...")
  );
}

const queryClient = hasUsableDatabaseUrl(databaseConfig.connectionString)
  ? neon(databaseConfig.connectionString)
  : null;

const drizzleClient = queryClient
  ? drizzle(queryClient, {
      schema,
    })
  : null;

type DrizzleClient = NonNullable<typeof drizzleClient>;

export const db: DrizzleClient =
  drizzleClient ??
  (new Proxy(
    {},
    {
      get() {
        throw new Error(
          "DATABASE_URL is not configured. Unable to use Drizzle + Neon.",
        );
      },
    },
  ) as DrizzleClient);

export function getDatabaseHealth(): DatabaseHealth {
  const configured = hasUsableDatabaseUrl(databaseConfig.connectionString);

  return {
    provider: databaseConfig.provider,
    orm: databaseConfig.orm,
    configured,
    status: configured ? "ready" : "missing_env",
  };
}

export async function persistOnboardingDraft(analysis: OnboardingAnalysis) {
  const health = getDatabaseHealth();

  return {
    saved: false,
    reason: health.configured
      ? "Integracao Drizzle/Neon prevista para a proxima etapa do MVP."
      : "Defina DATABASE_URL para persistir o onboarding.",
    summary: analysis.summary,
  };
}
