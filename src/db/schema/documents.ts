import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { sales } from "./sales";
import { documentTypeEnum, documentUploadSourceEnum } from "./enums";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: documentTypeEnum("type").notNull(),
    fileUrl: text("file_url").notNull(),
    extractedData: jsonb("extracted_data")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    linkedSaleId: uuid("linked_sale_id").references(() => sales.id, {
      onDelete: "set null",
    }),
    uploadedVia: documentUploadSourceEnum("uploaded_via").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("documents_tenant_id_idx").on(table.tenantId),
    index("documents_tenant_type_idx").on(table.tenantId, table.type),
    index("documents_tenant_created_at_idx").on(table.tenantId, table.createdAt),
    index("documents_linked_sale_id_idx").on(table.linkedSaleId),
  ],
);
