import {
  actionSchemas,
  actionTypeEnum,
  appointments,
  appointmentStatusEnum,
  businessProfiles,
  businessToneEnum,
  collections,
  collectionStatusEnum,
  conversationMemory,
  documents,
  documentTypeEnum,
  documentUploadSourceEnum,
  sales,
  salePaymentStatusEnum,
  tenantPlanEnum,
  tenants,
} from "./index";

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type NewBusinessProfile = typeof businessProfiles.$inferInsert;

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export type ActionSchema = typeof actionSchemas.$inferSelect;
export type NewActionSchema = typeof actionSchemas.$inferInsert;

export type ConversationMemory = typeof conversationMemory.$inferSelect;
export type NewConversationMemory = typeof conversationMemory.$inferInsert;

export type TenantPlan = (typeof tenantPlanEnum.enumValues)[number];
export type BusinessTone = (typeof businessToneEnum.enumValues)[number];
export type SalePaymentStatus =
  (typeof salePaymentStatusEnum.enumValues)[number];
export type DocumentType = (typeof documentTypeEnum.enumValues)[number];
export type DocumentUploadSource =
  (typeof documentUploadSourceEnum.enumValues)[number];
export type AppointmentStatus =
  (typeof appointmentStatusEnum.enumValues)[number];
export type CollectionStatus =
  (typeof collectionStatusEnum.enumValues)[number];
export type ActionType = (typeof actionTypeEnum.enumValues)[number];

export type { BusinessProduct } from "./schema/business-profile";
