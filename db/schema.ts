import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

type Plan = "free" | "pro" | "business";
type AgentType = "sdr" | "cs" | "financeiro" | "marketing";
type AgentStatus = "active" | "paused" | "configuring";
type OnboardingStep =
  | "intro"
  | "collecting"
  | "analyzing"
  | "generating"
  | "done";

export interface AgentConfig {
  channels?: string[];
  goals?: string[];
  integrations?: string[];
  handoffRules?: string[];
  [key: string]: unknown;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ExtractedOnboardingData {
  companyName?: string;
  segment?: string;
  size?: string;
  mainPain?: string;
  icp?: string;
  product?: string;
  tone?: string;
  [key: string]: unknown;
}

// users - gerenciado pelo Clerk, mas referenciado aqui
export const users = pgTable("users", {
  id: text("id").primaryKey(), // clerk user id
  email: text("email").notNull(),
  name: text("name"),
  plan: text("plan").$type<Plan>().notNull().default("free"), // free | pro | business
  createdAt: timestamp("created_at").defaultNow(),
});

// companies - dados coletados no onboarding
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  segment: text("segment"), // ex: agencia, clinica, loja, consultoria
  size: text("size"), // MEI, 2-5, 6-20, 20+
  mainPain: text("main_pain"), // dor principal identificada no onboarding
  icp: text("icp"), // perfil do cliente ideal
  product: text("product"), // o que vende
  tone: text("tone"), // tom de voz: formal, casual, tecnico
  rawOnboarding: text("raw_onboarding"), // transcript completo do onboarding
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// agents - agentes criados para cada empresa
export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  userId: text("user_id").notNull(),
  type: text("type").$type<AgentType>().notNull(), // sdr | cs | financeiro | marketing
  name: text("name").notNull(), // ex: "VECTOR", "ARIA", "FLUX"
  status: text("status").$type<AgentStatus>().notNull().default("active"), // active | paused | configuring
  systemPrompt: text("system_prompt").notNull(), // gerado automaticamente pelo onboarding
  config: json("config").$type<AgentConfig>(), // configuracoes especificas do agente
  messagesCount: integer("messages_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// conversations - historico de conversas com agentes
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id),
  userId: text("user_id").notNull(),
  messages: json("messages")
    .$type<ConversationMessage[]>()
    .notNull()
    .default(sql`'[]'::json`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// onboarding_sessions - sessoes de onboarding em progresso
export const onboardingSessions = pgTable("onboarding_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  messages: json("messages")
    .$type<ConversationMessage[]>()
    .notNull()
    .default(sql`'[]'::json`),
  extractedData: json("extracted_data").$type<ExtractedOnboardingData>(), // dados extraidos ate agora
  step: text("step").$type<OnboardingStep>().default("intro"), // intro | collecting | analyzing | generating | done
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type OnboardingSession = typeof onboardingSessions.$inferSelect;
export type NewOnboardingSession = typeof onboardingSessions.$inferInsert;
