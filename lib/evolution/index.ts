import "server-only";

import { EvolutionClient } from "@/lib/evolution/client";

let evolutionClient: EvolutionClient | null = null;

function getRequiredEnv(name: "EVOLUTION_API_URL" | "EVOLUTION_API_KEY") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} nao configurada.`);
  }

  return value;
}

export function getEvolutionClient() {
  if (!evolutionClient) {
    evolutionClient = new EvolutionClient(
      getRequiredEnv("EVOLUTION_API_URL"),
      getRequiredEnv("EVOLUTION_API_KEY"),
    );
  }

  return evolutionClient;
}

export { EvolutionClient } from "@/lib/evolution/client";
export type {
  ConnectionState,
  EvolutionInstance,
  EvolutionMessageData,
  EvolutionWebhookPayload,
  SendTextPayload,
} from "@/lib/evolution/types";
