import type {
  ActionSchema,
  ActionType,
  BusinessProfile,
  DocumentType,
  Tenant,
} from "@/src/db/types";

export enum RouterIntent {
  SALE_REGISTER = "SALE_REGISTER",
  DOCUMENT_STORE = "DOCUMENT_STORE",
  COLLECTION_TRACK = "COLLECTION_TRACK",
  APPOINTMENT_SCHEDULE = "APPOINTMENT_SCHEDULE",
  REPORT_REQUEST = "REPORT_REQUEST",
  GENERAL_CHAT = "GENERAL_CHAT",
}

export type WhatsAppMessageType = "text" | "image" | "document" | "audio";

export interface ProcessedWhatsAppMessage {
  tenantId: string;
  tenantWhatsappNumber: string;
  phoneNumber: string;
  pushName: string | null;
  messageId: string;
  messageType: WhatsAppMessageType;
  messageContent: string;
  mediaUrl?: string;
  mimeType?: string;
  rawPayload: unknown;
  receivedAt: string;
}

export interface IntentClassification {
  intent: RouterIntent;
  confidence: number;
  extracted: Record<string, unknown>;
}

export interface AgentContext {
  tenant: Tenant;
  businessProfile: BusinessProfile | null;
  actionSchemas: ActionSchema[];
  actionMap: Partial<Record<ActionType, ActionSchema>>;
  customerPhone: string;
  customerName: string | null;
  extractedData: Record<string, unknown>;
  message: ProcessedWhatsAppMessage;
  intent: RouterIntent;
  confidence: number;
}

export interface RouterDispatchResult {
  intent: RouterIntent;
  confidence: number;
  actionExecuted: boolean;
  responseText?: string;
  responseDocument?: {
    fileUrl: string;
    caption?: string;
    fileName?: string;
  };
  blockedReason?: string;
  createdRecordId?: string;
  extracted: Record<string, unknown>;
}

export interface RouterHandlerInput {
  message: ProcessedWhatsAppMessage;
  context: AgentContext;
  classification: IntentClassification;
}

export interface SecretaryActionHandler {
  canHandle(intent: RouterIntent): boolean;
  handle(context: AgentContext): Promise<RouterDispatchResult>;
}

export interface QueuedWhatsAppJob {
  message: ProcessedWhatsAppMessage;
}

export type IntentActionGuard = Exclude<RouterIntent, RouterIntent.GENERAL_CHAT>;

export type RouterActionType =
  | Extract<ActionType, "sale_register">
  | Extract<ActionType, "document_store">
  | Extract<ActionType, "collection_track">
  | Extract<ActionType, "appointment_schedule">
  | Extract<ActionType, "report_generate">;

export interface DocumentExtractionPayload {
  documentType?: DocumentType;
  title?: string;
  amount?: number;
  issueDate?: string;
  [key: string]: unknown;
}
