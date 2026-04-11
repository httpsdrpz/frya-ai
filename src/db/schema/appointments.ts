import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { appointmentStatusEnum } from "./enums";

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    reminderAt: timestamp("reminder_at", { withTimezone: true }),
    status: appointmentStatusEnum("status").notNull().default("scheduled"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("appointments_tenant_id_idx").on(table.tenantId),
    index("appointments_tenant_status_idx").on(table.tenantId, table.status),
    index("appointments_tenant_scheduled_at_idx").on(
      table.tenantId,
      table.scheduledAt,
    ),
    index("appointments_tenant_created_at_idx").on(table.tenantId, table.createdAt),
    index("appointments_customer_phone_idx").on(table.customerPhone),
  ],
);
