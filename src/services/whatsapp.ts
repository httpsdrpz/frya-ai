import "server-only";

import { getEvolutionClient } from "@/lib/evolution";
import { normalizeBrazilianPhone } from "@/lib/onboarding-quiz";

interface SendOptions {
  tenantId?: string;
  delay?: number;
}

interface SendDocumentOptions extends SendOptions {
  fileName?: string;
}

export interface DownloadedMediaFile {
  buffer: Buffer;
  base64: string;
  contentType: string | null;
  fileName: string | null;
  resolvedUrl: string;
}

const RATE_LIMIT_WINDOW_MS = 650;
const MAX_RETRIES = 3;

const tenantSendChains = new Map<string, Promise<void>>();
const tenantLastSendAt = new Map<string, number>();

function getEvolutionInstanceName() {
  const instanceName = process.env.EVOLUTION_INSTANCE?.trim();

  if (!instanceName) {
    throw new Error("EVOLUTION_INSTANCE nao configurada.");
  }

  return instanceName;
}

function getEvolutionApiConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL?.trim();
  const apiKey = process.env.EVOLUTION_API_KEY?.trim();

  if (!baseUrl) {
    throw new Error("EVOLUTION_API_URL nao configurada.");
  }

  if (!apiKey) {
    throw new Error("EVOLUTION_API_KEY nao configurada.");
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getTenantLimiterKey(phoneNumber: string, options?: SendOptions) {
  return options?.tenantId?.trim() || normalizeBrazilianPhone(phoneNumber) || "default";
}

async function withRetry<T>(operation: () => Promise<T>) {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_RETRIES) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (attempt >= MAX_RETRIES) {
        break;
      }

      const backoffMs = 400 * 2 ** (attempt - 1) + Math.round(Math.random() * 150);
      await sleep(backoffMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao enviar mensagem via Evolution API.");
}

async function runWithinTenantRateLimit<T>(
  tenantKey: string,
  operation: () => Promise<T>,
) {
  const previous = tenantSendChains.get(tenantKey) ?? Promise.resolve();

  const current = previous
    .catch(() => undefined)
    .then(async () => {
      const lastSentAt = tenantLastSendAt.get(tenantKey) ?? 0;
      const waitMs = Math.max(0, RATE_LIMIT_WINDOW_MS - (Date.now() - lastSentAt));

      if (waitMs > 0) {
        await sleep(waitMs);
      }

      const result = await operation();
      tenantLastSendAt.set(tenantKey, Date.now());
      return result;
    });

  tenantSendChains.set(
    tenantKey,
    current.then(
      () => undefined,
      () => undefined,
    ),
  );

  return current;
}

export async function sendMessage(
  phoneNumber: string,
  text: string,
  options?: SendOptions,
) {
  const normalizedPhone = normalizeBrazilianPhone(phoneNumber);
  const instanceName = getEvolutionInstanceName();
  const tenantKey = getTenantLimiterKey(normalizedPhone, options);

  if (!normalizedPhone) {
    throw new Error("Numero do WhatsApp invalido para envio.");
  }

  if (!text.trim()) {
    throw new Error("Texto da mensagem nao pode ficar vazio.");
  }

  return runWithinTenantRateLimit(tenantKey, () =>
    withRetry(() =>
      getEvolutionClient().sendText(instanceName, {
        number: normalizedPhone,
        text: text.trim(),
        ...(options?.delay !== undefined ? { delay: options.delay } : {}),
      }),
    ),
  );
}

export async function sendDocument(
  phoneNumber: string,
  fileUrl: string,
  caption?: string,
  options?: SendDocumentOptions,
) {
  const normalizedPhone = normalizeBrazilianPhone(phoneNumber);
  const instanceName = getEvolutionInstanceName();
  const tenantKey = getTenantLimiterKey(normalizedPhone, options);

  if (!normalizedPhone) {
    throw new Error("Numero do WhatsApp invalido para envio.");
  }

  if (!fileUrl.trim()) {
    throw new Error("URL do documento nao pode ficar vazia.");
  }

  return runWithinTenantRateLimit(tenantKey, () =>
    withRetry(() =>
      getEvolutionClient().sendDocument(instanceName, {
        number: normalizedPhone,
        media: fileUrl.trim(),
        ...(caption?.trim() ? { caption: caption.trim() } : {}),
        ...(options?.fileName?.trim() ? { fileName: options.fileName.trim() } : {}),
        ...(options?.delay !== undefined ? { delay: options.delay } : {}),
      }),
    ),
  );
}

export async function downloadMediaFile(mediaUrl: string): Promise<DownloadedMediaFile> {
  const trimmedUrl = mediaUrl.trim();

  if (!trimmedUrl) {
    throw new Error("mediaUrl nao pode ficar vazia.");
  }

  const { baseUrl, apiKey } = getEvolutionApiConfig();
  const resolvedUrl = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : new URL(trimmedUrl.replace(/^\/+/, ""), `${baseUrl}/`).toString();

  const response = await withRetry(async () => {
    const result = await fetch(resolvedUrl, {
      method: "GET",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!result.ok) {
      throw new Error(`Falha ao baixar media: ${result.status} ${result.statusText}`);
    }

    return result;
  });

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type");
  const contentDisposition = response.headers.get("content-disposition");
  const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);

  return {
    buffer,
    base64: buffer.toString("base64"),
    contentType,
    fileName: fileNameMatch?.[1] ?? null,
    resolvedUrl,
  };
}
