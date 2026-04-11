import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { sales } from "./sales";
import { collectionStatusEnum } from "./enums";

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    linkedSaleId: uuid("linked_sale_id").references(() => sales.id, {
      onDelete: "set null",
    }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    status: collectionStatusEnum("status").notNull().default("pending"),
    lastReminderSentAt: timestamp("last_reminder_sent_at", {
      withTimezone: true,
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("collections_tenant_id_idx").on(table.tenantId),
    index("collections_tenant_status_idx").on(table.tenantId, table.status),
    index("collections_tenant_due_date_idx").on(table.tenantId, table.dueDate),
    index("collections_tenant_created_at_idx").on(table.tenantId, table.createdAt),
    index("collections_linked_sale_id_idx").on(table.linkedSaleId),
    index("collections_customer_phone_idx").on(table.customerPhone),
  ],
);
