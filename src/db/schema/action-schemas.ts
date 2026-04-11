import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { actionTypeEnum } from "./enums";

export const actionSchemas = pgTable(
  "action_schemas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actionType: actionTypeEnum("action_type").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("action_schemas_tenant_action_type_idx").on(
      table.tenantId,
      table.actionType,
    ),
    index("action_schemas_tenant_enabled_idx").on(table.tenantId, table.isEnabled),
    index("action_schemas_tenant_created_at_idx").on(table.tenantId, table.createdAt),
  ],
);
