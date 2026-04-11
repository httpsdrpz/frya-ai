import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenantPlanEnum } from "./enums";

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    segment: text("segment"),
    whatsappNumber: text("whatsapp_number").notNull(),
    plan: tenantPlanEnum("plan").notNull().default("free"),
    onboardingCompleted: boolean("onboarding_completed")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tenants_whatsapp_number_idx").on(table.whatsappNumber),
    index("tenants_plan_idx").on(table.plan),
    index("tenants_onboarding_completed_idx").on(table.onboardingCompleted),
    index("tenants_created_at_idx").on(table.createdAt),
  ],
);
