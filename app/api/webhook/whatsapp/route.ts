import { or, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeBrazilianPhone } from "@/lib/onboarding-quiz";
import { tenants } from "@/src/db";
import type { ProcessedWhatsAppMessage, WhatsAppMessageType } from "@/src/agents/types";
import { enqueueWhatsAppMessage } from "@/src/services/message-queue";
import { sendMessage } from "@/src/services/whatsapp";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRecord(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const candidate = value[key];
  return isRecord(candidate) ? candidate : null;
}

function getString(value: Record<string, unknown>, key: string) {
  const candidate = value[key];
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
}

function getArray(value: Record<string, unknown>, key: string) {
  const candidate = value[key];
  return Array.isArray(candidate) ? candidate : [];
}

function extractDigits(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const jid = value.split("@")[0] ?? value;
  return normalizeBrazilianPhone(jid.replace(/\D/g, ""));
}

function normalizeEventName(eventName: string) {
  return eventName.trim().toLowerCase().replace(/_/g, ".");
}

function isMessagesUpsertEvent(payload: Record<string, unknown>) {
  const eventName = getString(payload, "event");

  if (!eventName) {
    return false;
  }

  const normalized = normalizeEventName(eventName);
  return normalized === "messages.upsert";
}

function extractMessageContainer(payload: Record<string, unknown>) {
  const data = getRecord(payload, "data");

  if (!data) {
    return null;
  }

  const candidates = [
    ...getArray(data, "messages").filter(isRecord),
    ...getArray(data, "message").filter(isRecord),
    data,
  ];

  return candidates.find((candidate) => getRecord(candidate, "key")) ?? null;
}

function extractSenderPhone(messageContainer: Record<string, unknown>) {
  const key = getRecord(messageContainer, "key");

  if (!key) {
    return "";
  }

  return (
    extractDigits(getString(key, "remoteJid")) ||
    extractDigits(getString(key, "participant")) ||
    extractDigits(getString(messageContainer, "remoteJid"))
  );
}

function extractTenantLookupPhone(payload: Record<string, unknown>) {
  const data = getRecord(payload, "data");
  const instanceData =
    (data && getRecord(data, "instanceData")) ??
    getRecord(payload, "instanceData") ??
    null;
  const key = data ? getRecord(data, "key") : null;

  const candidates = [
    extractDigits(getString(instanceData ?? {}, "owner")),
    extractDigits(getString(instanceData ?? {}, "ownerJid")),
    extractDigits(getString(instanceData ?? {}, "number")),
    extractDigits(getString(data ?? {}, "owner")),
    extractDigits(getString(data ?? {}, "ownerJid")),
    extractDigits(getString(data ?? {}, "instance")),
    extractDigits(getString(data ?? {}, "instanceName")),
    extractDigits(getString(payload, "instance")),
    extractDigits(getString(payload, "instanceName")),
    extractDigits(getString(key ?? {}, "me")),
  ];

  return candidates.find(Boolean) ?? "";
}

function extractReceivedAt(messageContainer: Record<string, unknown>) {
  const rawTimestamp =
    messageContainer.messageTimestamp ?? messageContainer.message_timestamp;

  if (typeof rawTimestamp === "number") {
    const timestamp = rawTimestamp > 10_000_000_000 ? rawTimestamp : rawTimestamp * 1000;
    return new Date(timestamp).toISOString();
  }

  if (typeof rawTimestamp === "string" && rawTimestamp.trim()) {
    const numeric = Number.parseInt(rawTimestamp, 10);

    if (Number.isFinite(numeric)) {
      const timestamp = numeric > 10_000_000_000 ? numeric : numeric * 1000;
      return new Date(timestamp).toISOString();
    }

    const parsed = new Date(rawTimestamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

function extractMessagePayload(messageContainer: Record<string, unknown>) {
  return getRecord(messageContainer, "message") ?? null;
}

function extractMediaUrl(mediaPayload: Record<string, unknown>) {
  return (
    getString(mediaPayload, "url") ??
    getString(mediaPayload, "mediaUrl") ??
    getString(mediaPayload, "fileUrl") ??
    null
  );
}

function extractMessageType(
  messagePayload: Record<string, unknown>,
): { type: WhatsAppMessageType; content: string; mediaUrl?: string; mimeType?: string } | null {
  const conversation = getString(messagePayload, "conversation");
  const extended = getRecord(messagePayload, "extendedTextMessage");
  const extendedText = extended ? getString(extended, "text") : null;

  if (conversation || extendedText) {
    return {
      type: "text",
      content: conversation ?? extendedText ?? "",
    };
  }

  const image = getRecord(messagePayload, "imageMessage");
  if (image) {
    return {
      type: "image",
      content: getString(image, "caption") ?? "[image]",
      ...(extractMediaUrl(image) ? { mediaUrl: extractMediaUrl(image)! } : {}),
      ...(getString(image, "mimetype") ? { mimeType: getString(image, "mimetype")! } : {}),
    };
  }

  const document = getRecord(messagePayload, "documentMessage");
  if (document) {
    return {
      type: "document",
      content:
        getString(document, "caption") ??
        getString(document, "fileName") ??
        "[document]",
      ...(extractMediaUrl(document) ? { mediaUrl: extractMediaUrl(document)! } : {}),
      ...(getString(document, "mimetype")
        ? { mimeType: getString(document, "mimetype")! }
        : {}),
    };
  }

  const audio = getRecord(messagePayload, "audioMessage");
  if (audio) {
    return {
      type: "audio",
      content: "[audio]",
      ...(extractMediaUrl(audio) ? { mediaUrl: extractMediaUrl(audio)! } : {}),
      ...(getString(audio, "mimetype") ? { mimeType: getString(audio, "mimetype")! } : {}),
    };
  }

  return null;
}

async function findTenantByWhatsAppNumber(whatsappNumber: string) {
  const normalized = normalizeBrazilianPhone(whatsappNumber);

  if (!normalized) {
    return null;
  }

  const localNumber = normalized.startsWith("55") ? normalized.slice(2) : normalized;
  const result = await db
    .select()
    .from(tenants)
    .where(
      or(
        eq(tenants.whatsappNumber, normalized),
        eq(tenants.whatsappNumber, localNumber),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

async function maybeRespondWithSignupLink(phoneNumber: string) {
  const signupUrl =
    process.env.FRYA_SIGNUP_URL?.trim() ??
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    "";

  if (!signupUrl || !phoneNumber) {
    return;
  }

  try {
    await sendMessage(
      phoneNumber,
      `Esse numero ainda nao esta configurado na Frya. Cadastre sua empresa em ${signupUrl.replace(/\/+$/, "")}/register`,
    );
  } catch (error) {
    console.error("Falha ao responder link de cadastro para numero sem tenant:", error);
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Payload invalido.",
      },
      { status: 400 },
    );
  }

  if (!isRecord(payload) || !isMessagesUpsertEvent(payload)) {
    return NextResponse.json(
      {
        success: true,
        ignored: true,
        reason: "unsupported_event",
      },
      { status: 202 },
    );
  }

  const messageContainer = extractMessageContainer(payload);

  if (!messageContainer) {
    return NextResponse.json(
      {
        success: true,
        ignored: true,
        reason: "message_not_found",
      },
      { status: 202 },
    );
  }

  const key = getRecord(messageContainer, "key");
  const fromMe = key ? key.fromMe === true : false;

  if (fromMe) {
    return NextResponse.json(
      {
        success: true,
        ignored: true,
        reason: "outgoing_message",
      },
      { status: 202 },
    );
  }

  const senderPhone = extractSenderPhone(messageContainer);
  const tenantLookupPhone = extractTenantLookupPhone(payload);
  const messagePayload = extractMessagePayload(messageContainer);
  const messageData = messagePayload ? extractMessageType(messagePayload) : null;

  if (!senderPhone || !tenantLookupPhone || !messageData) {
    return NextResponse.json(
      {
        success: true,
        ignored: true,
        reason: "unable_to_extract_message_fields",
      },
      { status: 202 },
    );
  }

  const tenant = await findTenantByWhatsAppNumber(tenantLookupPhone);

  if (!tenant) {
    await maybeRespondWithSignupLink(senderPhone);

    return NextResponse.json(
      {
        success: true,
        ignored: true,
        reason: "tenant_not_found",
      },
      { status: 202 },
    );
  }

  const processedMessage: ProcessedWhatsAppMessage = {
    tenantId: tenant.id,
    tenantWhatsappNumber: tenant.whatsappNumber,
    phoneNumber: senderPhone,
    pushName: getString(messageContainer, "pushName"),
    messageId: getString(key ?? {}, "id") ?? crypto.randomUUID(),
    messageType: messageData.type,
    messageContent: messageData.content,
    ...(messageData.mediaUrl ? { mediaUrl: messageData.mediaUrl } : {}),
    ...(messageData.mimeType ? { mimeType: messageData.mimeType } : {}),
    rawPayload: payload,
    receivedAt: extractReceivedAt(messageContainer),
  };

  const queue = enqueueWhatsAppMessage({
    message: processedMessage,
  });

  return NextResponse.json(
    {
      success: true,
      queued: true,
      queue,
      tenantId: tenant.id,
      messageId: processedMessage.messageId,
    },
    { status: 202 },
  );
}
