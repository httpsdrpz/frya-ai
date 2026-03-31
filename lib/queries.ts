import type { ConversationMessage } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { agents, companies, conversations, leads } from "@/db/schema";
import { db } from "@/lib/db";
import type {
  AgentKey,
  ConversationPreview,
  LeadClassification,
  LeadFilters,
  LeadSource,
  LeadStats,
  LeadStatus,
} from "@/types";

const leadStatuses: LeadStatus[] = [
  "novo",
  "qualificado",
  "reuniao",
  "negociacao",
  "fechado",
  "perdido",
];

const leadClassifications: LeadClassification[] = [
  "hot",
  "warm",
  "cold",
  "unscored",
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return value.toISOString();
}

function truncateText(value: string, maxLength = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function getMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractLeadNameFromContent(content: string) {
  const jsonMatch = content.match(
    /"(?:leadName|clientName)"\s*:\s*"([^"]+)"/i,
  );

  if (jsonMatch?.[1]) {
    return jsonMatch[1].trim();
  }

  const labelMatch = content.match(/(?:Lead|Cliente)\s*:\s*([^\n]+)/i);

  if (labelMatch?.[1]) {
    return labelMatch[1].trim();
  }

  return null;
}

function extractLeadNameFromMessages(messages: ConversationMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const metadataLead =
      getMetadataString(message.metadata, "leadName") ??
      getMetadataString(message.metadata, "clientName");

    if (metadataLead) {
      return metadataLead;
    }

    const contentLead = extractLeadNameFromContent(message.content);

    if (contentLead) {
      return contentLead;
    }
  }

  return null;
}

function conversationMatchesLead(
  messages: ConversationMessage[],
  leadName: string,
) {
  const extractedLead = extractLeadNameFromMessages(messages);

  if (extractedLead && normalizeText(extractedLead) === normalizeText(leadName)) {
    return true;
  }

  return messages.some((message) =>
    normalizeText(message.content).includes(normalizeText(leadName)),
  );
}

function getLastMessage(messages: ConversationMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.content.trim()) {
      return message;
    }
  }

  return null;
}

function buildConversationPreview(
  row: {
    conversation: typeof conversations.$inferSelect;
    agent: {
      id: string;
      name: string;
      type: AgentKey;
    };
  },
): ConversationPreview {
  const messages = row.conversation.messages ?? [];
  const lastMessage = getLastMessage(messages);

  return {
    id: row.conversation.id,
    agentId: row.agent.id,
    agentName: row.agent.name,
    agentType: row.agent.type,
    leadName: extractLeadNameFromMessages(messages),
    preview: truncateText(lastMessage?.content ?? "Sem mensagens registradas."),
    lastMessageAt: toIsoString(lastMessage?.createdAt ?? row.conversation.updatedAt),
    updatedAt: toIsoString(row.conversation.updatedAt),
    messageCount: messages.length,
  };
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek() {
  const today = startOfToday();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diff);
  return monday;
}

export interface UpsertLeadInput {
  id?: string;
  companyId: string;
  userId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: LeadSource;
  status?: LeadStatus;
  score?: number;
  classification?: LeadClassification;
  mainPain?: string | null;
  notes?: string | null;
  nextStep?: string | null;
  nextStepAt?: Date | null;
  lastContactAt?: Date | null;
}

export interface LeadConversationRecord {
  id: string;
  agentId: string;
  agentName: string;
  agentType: AgentKey;
  updatedAt: string;
  messages: ConversationMessage[];
}

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
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
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

  if (!agent || agent.userId !== userId) {
    return null;
  }

  return agent;
}

export async function getConversationById(conversationId: string, userId: string) {
  const result = await db
    .select({
      conversation: conversations,
      agent: {
        id: agents.id,
        name: agents.name,
        type: agents.type,
      },
    })
    .from(conversations)
    .innerJoin(agents, eq(conversations.agentId, agents.id))
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

// Salva mensagem na conversa
export async function saveConversation(
  agentId: string,
  userId: string,
  messages: Array<{
    role: ConversationMessage["role"];
    content: string;
    createdAt?: string;
    metadata?: Record<string, unknown>;
  }>,
  conversationId?: string,
) {
  const storedMessages = messages.map((message) => ({
    role: message.role,
    content: message.content,
    ...(message.createdAt ? { createdAt: message.createdAt } : {}),
    ...(message.metadata ? { metadata: message.metadata } : {}),
  })) satisfies ConversationMessage[];

  let existing =
    conversationId &&
    (await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId),
        ),
      )
      .limit(1))[0];

  if (!existing) {
    existing = (
      await db
        .select()
        .from(conversations)
        .where(
          and(eq(conversations.agentId, agentId), eq(conversations.userId, userId)),
        )
        .orderBy(desc(conversations.updatedAt))
        .limit(1)
    )[0];
  }

  if (existing) {
    await db
      .update(conversations)
      .set({ messages: storedMessages, updatedAt: new Date() })
      .where(eq(conversations.id, existing.id));
    return existing.id;
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
    .orderBy(desc(conversations.updatedAt))
    .limit(1);
  return result[0] ?? null;
}

export async function getLeadsByCompany(
  companyId: string,
  filters?: LeadFilters,
) {
  const conditions = [eq(leads.companyId, companyId)];

  if (filters?.status) {
    conditions.push(eq(leads.status, filters.status));
  }

  if (filters?.classification) {
    conditions.push(eq(leads.classification, filters.classification));
  }

  return await db
    .select()
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.updatedAt), desc(leads.createdAt));
}

export async function getLeadById(leadId: string, userId: string) {
  const result = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  const lead = result[0] ?? null;

  if (!lead || lead.userId !== userId) {
    return null;
  }

  return lead;
}

export async function upsertLead(data: UpsertLeadInput) {
  if (data.id) {
    const existing = await getLeadById(data.id, data.userId);

    if (!existing) {
      throw new Error("Lead nao encontrado para atualizacao.");
    }

    const [updatedLead] = await db
      .update(leads)
      .set({
        companyId: data.companyId,
        userId: data.userId,
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        source: data.source ?? existing.source ?? "manual",
        status: data.status ?? existing.status ?? "novo",
        score: data.score ?? existing.score ?? 0,
        classification:
          data.classification ?? existing.classification ?? "unscored",
        mainPain: data.mainPain ?? existing.mainPain ?? null,
        notes: data.notes ?? existing.notes ?? null,
        nextStep: data.nextStep ?? existing.nextStep ?? null,
        nextStepAt:
          data.nextStepAt === undefined ? existing.nextStepAt : data.nextStepAt,
        lastContactAt:
          data.lastContactAt === undefined
            ? existing.lastContactAt
            : data.lastContactAt,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, data.id))
      .returning();

    return updatedLead;
  }

  const [createdLead] = await db
    .insert(leads)
    .values({
      companyId: data.companyId,
      userId: data.userId,
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      source: data.source ?? "manual",
      status: data.status ?? "novo",
      score: data.score ?? 0,
      classification: data.classification ?? "unscored",
      mainPain: data.mainPain ?? null,
      notes: data.notes ?? null,
      nextStep: data.nextStep ?? null,
      nextStepAt: data.nextStepAt ?? null,
      lastContactAt: data.lastContactAt ?? null,
    })
    .returning();

  return createdLead;
}

export async function getLeadStats(companyId: string): Promise<LeadStats> {
  const rows = await db
    .select({
      status: leads.status,
      classification: leads.classification,
      score: leads.score,
      createdAt: leads.createdAt,
      nextStepAt: leads.nextStepAt,
    })
    .from(leads)
    .where(eq(leads.companyId, companyId));

  const statusCounts = Object.fromEntries(
    leadStatuses.map((status) => [status, 0]),
  ) as Record<LeadStatus, number>;
  const classificationCounts = Object.fromEntries(
    leadClassifications.map((classification) => [classification, 0]),
  ) as Record<LeadClassification, number>;
  const today = startOfToday();
  const weekStart = startOfWeek();
  const now = new Date();

  let scoreTotal = 0;
  let scoreCount = 0;
  let newToday = 0;
  let newThisWeek = 0;
  let followUpsPending = 0;

  for (const row of rows) {
    statusCounts[row.status ?? "novo"] += 1;
    classificationCounts[row.classification ?? "unscored"] += 1;

    if (typeof row.score === "number" && row.score > 0) {
      scoreTotal += row.score;
      scoreCount += 1;
    }

    if (row.createdAt && row.createdAt >= today) {
      newToday += 1;
    }

    if (row.createdAt && row.createdAt >= weekStart) {
      newThisWeek += 1;
    }

    if (
      row.nextStepAt &&
      row.nextStepAt <= now &&
      row.status !== "fechado" &&
      row.status !== "perdido"
    ) {
      followUpsPending += 1;
    }
  }

  const qualifiedLeads =
    statusCounts.qualificado +
    statusCounts.reuniao +
    statusCounts.negociacao +
    statusCounts.fechado;
  const conversionRate = rows.length
    ? Number(((statusCounts.fechado / rows.length) * 100).toFixed(1))
    : 0;

  return {
    totalLeads: rows.length,
    statusCounts,
    classificationCounts,
    averageScore: scoreCount ? Math.round(scoreTotal / scoreCount) : 0,
    newToday,
    newThisWeek,
    qualifiedLeads,
    conversionRate,
    followUpsPending,
  };
}

export async function getRecentConversations(
  userId: string,
  limit = 5,
  filters?: { agentType?: AgentKey },
): Promise<ConversationPreview[]> {
  const result = await db
    .select({
      conversation: conversations,
      agent: {
        id: agents.id,
        name: agents.name,
        type: agents.type,
      },
    })
    .from(conversations)
    .innerJoin(agents, eq(conversations.agentId, agents.id))
    .where(
      filters?.agentType
        ? and(
            eq(conversations.userId, userId),
            eq(agents.type, filters.agentType),
          )
        : eq(conversations.userId, userId),
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);

  return result.map((row) =>
    buildConversationPreview({
      conversation: row.conversation,
      agent: {
        id: row.agent.id,
        name: row.agent.name,
        type: row.agent.type,
      },
    }),
  );
}

export async function getLeadConversations(
  leadId: string,
  userId: string,
  limit = 6,
): Promise<LeadConversationRecord[]> {
  const lead = await getLeadById(leadId, userId);

  if (!lead) {
    return [];
  }

  const result = await db
    .select({
      conversation: conversations,
      agent: {
        id: agents.id,
        name: agents.name,
        type: agents.type,
      },
    })
    .from(conversations)
    .innerJoin(agents, eq(conversations.agentId, agents.id))
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));

  return result
    .filter((row) => conversationMatchesLead(row.conversation.messages ?? [], lead.name))
    .slice(0, limit)
    .map((row) => ({
      id: row.conversation.id,
      agentId: row.agent.id,
      agentName: row.agent.name,
      agentType: row.agent.type,
      updatedAt: toIsoString(row.conversation.updatedAt),
      messages: row.conversation.messages ?? [],
    }));
}
