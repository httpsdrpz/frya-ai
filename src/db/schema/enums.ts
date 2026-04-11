import { pgEnum } from "drizzle-orm/pg-core";

export const tenantPlanEnum = pgEnum("tenant_plan", [
  "free",
  "starter",
  "pro",
]);

export const businessToneEnum = pgEnum("business_tone", [
  "formal",
  "casual",
  "tecnico",
]);

export const salePaymentStatusEnum = pgEnum("sale_payment_status", [
  "pending",
  "paid",
  "overdue",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "nf",
  "cupom",
  "comprovante",
  "contrato",
  "outro",
]);

export const documentUploadSourceEnum = pgEnum("document_upload_source", [
  "whatsapp",
  "dashboard",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "cancelled",
]);

export const collectionStatusEnum = pgEnum("collection_status", [
  "pending",
  "sent",
  "paid",
  "overdue",
]);

export const actionTypeEnum = pgEnum("action_type", [
  "sale_register",
  "document_store",
  "appointment_schedule",
  "collection_track",
  "report_generate",
  "custom",
]);
