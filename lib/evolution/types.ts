export interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  status: string;
  apikey: string;
  qrcode?: string;
  ownerJid?: string;
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: Record<string, unknown>;
}

export interface EvolutionMessageData {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number | string;
  pushName: string;
}

export interface SendTextPayload {
  number: string;
  text: string;
  delay?: number;
}

export interface SendDocumentPayload {
  number: string;
  media: string;
  caption?: string;
  fileName?: string;
  delay?: number;
}

export type ConnectionState = "open" | "close" | "connecting";
