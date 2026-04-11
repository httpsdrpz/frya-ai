import { sql } from "drizzle-orm";
import { jsonb, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { businessToneEnum } from "./enums";

export interface BusinessProduct {
  name: string;
  price: number;
  description?: string;
}

export const businessProfiles = pgTable("business_profiles", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  segment: text("segment"),
  products: jsonb("products")
    .$type<BusinessProduct[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  paymentMethods: jsonb("payment_methods")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  averageTicket: numeric("average_ticket", { precision: 12, scale: 2 }),
  salesChannels: jsonb("sales_channels")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  workingHours: text("working_hours"),
  tone: businessToneEnum("tone").notNull().default("casual"),
  customInstructions: text("custom_instructions"),
});
