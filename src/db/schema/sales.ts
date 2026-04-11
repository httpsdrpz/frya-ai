import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { salePaymentStatusEnum } from "./enums";

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    productOrService: text("product_or_service").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    totalValue: numeric("total_value", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: text("payment_method").notNull(),
    paymentStatus: salePaymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    installments: integer("installments").notNull().default(1),
    notes: text("notes"),
    saleDate: timestamp("sale_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sales_tenant_id_idx").on(table.tenantId),
    index("sales_tenant_status_idx").on(table.tenantId, table.paymentStatus),
    index("sales_tenant_sale_date_idx").on(table.tenantId, table.saleDate),
    index("sales_tenant_created_at_idx").on(table.tenantId, table.createdAt),
    index("sales_customer_phone_idx").on(table.customerPhone),
  ],
);
