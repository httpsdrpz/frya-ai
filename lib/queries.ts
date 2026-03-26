import type { ConversationMessage } from "@/db/schema";
import { eq } from "drizzle-orm";
import { agents, companies, conversations } from "@/db/schema";
import { db } from "@/lib/db";

// Busca a empresa do usuario logado
export async function getCompanyByUserId(userId: string) {
  const result = await db
    .select()
    .from(companies)
    .where(eq(companies.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

// Busca os agentes do usuario logado
export async function getAgentsByUserId(userId: string) {
  return await db.select().from(agents).where(eq(agents.userId, userId));
}

// Busca total de mensagens de todos os agentes do usuario
export async function getConversationsByUserId(userId: string) {
  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId));
}

// Verifica se o usuario completou o onboarding
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const company = await getCompanyByUserId(userId);
  return company?.onboardingCompleted ?? false;
}

// Busca agente por ID - verifica se pertence ao usuario logado
export async function getAgentById(agentId: string, userId: string) {
  const result = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  const agent = result[0] ?? null;

  // Seguranca: so retorna se pertencer ao usuario
  if (!agent || agent.userId !== userId) return null;

  return agent;
}

// Salva mensagem na conversa
export async function saveConversation(
  agentId: string,
  userId: string,
  messages: { role: string; content: string }[],
) {
  const storedMessages = messages as ConversationMessage[];

  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.agentId, agentId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(conversations)
      .set({ messages: storedMessages, updatedAt: new Date() })
      .where(eq(conversations.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(conversations)
    .values({ agentId, userId, messages: storedMessages })
    .returning();

  return created.id;
}

// Busca historico de conversa do agente
export async function getConversationByAgent(agentId: string) {
  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.agentId, agentId))
    .limit(1);
  return result[0] ?? null;
}
