import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as legacySchema from "@/db/schema";
import * as multiTenantSchema from "@/src/db";
import type { DatabaseHealth, OnboardingAnalysis } from "@/types";

function readLocalEnv(key: string) {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return undefined;
  }

  const content = fs.readFileSync(envPath, "utf8");
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${key}=`));

  if (!line) {
    return undefined;
  }

  return line.slice(key.length + 1).trim();
}

export const databaseConfig = {
  provider: "neon" as const,
  orm: "drizzle" as const,
  connectionString: process.env.DATABASE_URL ?? readLocalEnv("DATABASE_URL") ?? "",
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
      schema: {
        ...legacySchema,
        ...multiTenantSchema,
      },
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
