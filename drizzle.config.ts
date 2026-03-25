import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

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

const databaseUrl = process.env.DATABASE_URL ?? readLocalEnv("DATABASE_URL") ?? "";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
