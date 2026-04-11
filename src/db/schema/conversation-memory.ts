import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const conversationMemory = pgTable(
  "conversation_memory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerPhone: text("customer_phone").notNull(),
    summary: text("summary").notNull(),
    lastInteractionAt: timestamp("last_interaction_at", {
      withTimezone: true,
    }).notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (table) => [
    uniqueIndex("conversation_memory_tenant_customer_phone_idx").on(
      table.tenantId,
      table.customerPhone,
    ),
    index("conversation_memory_tenant_last_interaction_idx").on(
      table.tenantId,
      table.lastInteractionAt,
    ),
  ],
);
