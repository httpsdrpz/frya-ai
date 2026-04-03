import "server-only";

import type {
  ConnectionState,
  EvolutionInstance,
  SendTextPayload,
} from "@/lib/evolution/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRecord(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function getString(value: Record<string, unknown>, key: string) {
  const candidate = value[key];
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();

  if (!trimmed) {
    throw new Error("EVOLUTION_API_URL nao configurada.");
  }

  try {
    const url = new URL(trimmed);
    return url.toString().replace(/\/+$/, "");
  } catch {
    throw new Error("EVOLUTION_API_URL invalida.");
  }
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Erro desconhecido.";
}

function extractErrorMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  const directMessage = getString(payload, "message");
  if (directMessage) {
    return directMessage;
  }

  const directError = getString(payload, "error");
  if (directError) {
    return directError;
  }

  const response = getRecord(payload, "response");
  const responseMessage = response ? getString(response, "message") : null;

  if (responseMessage) {
    return responseMessage;
  }

  return null;
}

function extractPayloadCandidate(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  const candidates = [
    payload,
    getRecord(payload, "data"),
    getRecord(payload, "instance"),
    getRecord(getRecord(payload, "data") ?? {}, "instance"),
  ];

  return candidates.find((candidate) => isRecord(candidate)) ?? null;
}

function normalizeConnectionState(value: string): ConnectionState {
  const normalized = value.toLowerCase();

  if (normalized.includes("open") || normalized.includes("connected")) {
    return "open";
  }

  if (
    normalized.includes("connecting") ||
    normalized.includes("qr") ||
    normalized.includes("pairing")
  ) {
    return "connecting";
  }

  if (
    normalized.includes("close") ||
    normalized.includes("closed") ||
    normalized.includes("disconnect")
  ) {
    return "close";
  }

  throw new Error(`Estado de conexao desconhecido: ${value}`);
}

function ensureNonEmptyString(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} e obrigatorio.`);
  }

  return trimmed;
}

function ensureWebhookUrl(webhookUrl: string) {
  const trimmed = ensureNonEmptyString(webhookUrl, "Webhook URL");

  try {
    return new URL(trimmed).toString();
  } catch {
    throw new Error("Webhook URL invalida.");
  }
}

export class EvolutionClient {
  private readonly baseUrl: string;

  private readonly globalApiKey: string;

  constructor(baseUrl: string, globalApiKey: string) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.globalApiKey = ensureNonEmptyString(
      globalApiKey,
      "EVOLUTION_API_KEY",
    );
  }

  // Centraliza chamadas HTTP para padronizar autenticacao e mensagens de erro.
  private async request<T>(
    path: string,
    init: RequestInit,
    parser: (payload: unknown) => T,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        headers: {
          apikey: this.globalApiKey,
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...(init.headers ?? {}),
        },
      });
    } catch (error) {
      throw new Error(
        `Falha ao comunicar com a Evolution API em ${path}: ${formatErrorMessage(error)}`,
      );
    }

    const rawBody = await response.text();
    let payload: unknown = null;

    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = rawBody;
      }
    }

    if (!response.ok) {
      const apiMessage =
        extractErrorMessage(payload) ?? response.statusText ?? "Erro desconhecido.";
      throw new Error(
        `Evolution API retornou ${response.status} em ${path}: ${apiMessage}`,
      );
    }

    try {
      return parser(payload);
    } catch (error) {
      throw new Error(
        `Resposta invalida da Evolution API em ${path}: ${formatErrorMessage(error)}`,
      );
    }
  }

  private parseInstance(payload: unknown): EvolutionInstance {
    const candidate = extractPayloadCandidate(payload);

    if (!candidate) {
      throw new Error("Instancia nao encontrada na resposta.");
    }

    const instanceName =
      getString(candidate, "instanceName") ??
      getString(candidate, "name") ??
      getString(candidate, "instance");
    const instanceId =
      getString(candidate, "instanceId") ??
      getString(candidate, "id") ??
      getString(candidate, "instance_id");
    const status =
      getString(candidate, "status") ??
      getString(candidate, "connectionStatus") ??
      getString(candidate, "state");
    const apikey =
      getString(candidate, "apikey") ??
      getString(candidate, "apiKey") ??
      this.globalApiKey;
    const qrcode =
      getString(candidate, "qrcode") ??
      getString(candidate, "qrCode") ??
      getString(candidate, "base64");
    const ownerJid =
      getString(candidate, "ownerJid") ??
      getString(candidate, "owner") ??
      getString(candidate, "jid");

    if (!instanceName) {
      throw new Error("instanceName ausente.");
    }

    if (!instanceId) {
      throw new Error("instanceId ausente.");
    }

    if (!status) {
      throw new Error("status ausente.");
    }

    return {
      instanceName,
      instanceId,
      status,
      apikey,
      ...(qrcode ? { qrcode } : {}),
      ...(ownerJid ? { ownerJid } : {}),
    };
  }

  private parseQrCode(payload: unknown) {
    if (typeof payload === "string" && payload.trim()) {
      return payload.trim();
    }

    if (!isRecord(payload)) {
      throw new Error("QR code nao encontrado na resposta.");
    }

    const directQr =
      getString(payload, "qrcode") ??
      getString(payload, "qrCode") ??
      getString(payload, "base64");

    if (directQr) {
      return directQr;
    }

    const base64 =
      getString(getRecord(payload, "qrcode") ?? {}, "base64") ??
      getString(getRecord(payload, "qrCode") ?? {}, "base64") ??
      getString(getRecord(payload, "data") ?? {}, "base64") ??
      getString(getRecord(getRecord(payload, "data") ?? {}, "qrcode") ?? {}, "base64");

    if (!base64) {
      throw new Error("QR code base64 ausente.");
    }

    return base64;
  }

  private parseConnectionState(payload: unknown): ConnectionState {
    if (typeof payload === "string" && payload.trim()) {
      return normalizeConnectionState(payload.trim());
    }

    if (!isRecord(payload)) {
      throw new Error("Estado de conexao nao encontrado na resposta.");
    }

    const candidate =
      getString(payload, "instance") ??
      getString(payload, "status") ??
      getString(payload, "state") ??
      getString(payload, "connectionStatus") ??
      getString(getRecord(payload, "instance") ?? {}, "state") ??
      getString(getRecord(payload, "instance") ?? {}, "status") ??
      getString(getRecord(payload, "data") ?? {}, "state") ??
      getString(getRecord(payload, "data") ?? {}, "status");

    if (!candidate) {
      throw new Error("Campo de estado ausente.");
    }

    return normalizeConnectionState(candidate);
  }

  // Cria uma instancia do WhatsApp ja apontando para o webhook do projeto.
  async createInstance(
    name: string,
    webhookUrl: string,
  ): Promise<EvolutionInstance> {
    const instanceName = ensureNonEmptyString(name, "Nome da instancia");
    const webhook = ensureWebhookUrl(webhookUrl);

    return this.request(
      "/instance/create",
      {
        method: "POST",
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: {
            url: webhook,
            webhookByEvents: false,
            webhookBase64: false,
            events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
          },
        }),
      },
      (payload) => this.parseInstance(payload),
    );
  }

  // Busca o QR code atual da instancia em base64 para exibir no frontend.
  async getQRCode(instanceName: string): Promise<string> {
    const normalizedInstanceName = ensureNonEmptyString(
      instanceName,
      "Nome da instancia",
    );

    return this.request(
      `/instance/connect/${encodeURIComponent(normalizedInstanceName)}`,
      {
        method: "GET",
      },
      (payload) => this.parseQrCode(payload),
    );
  }

  // Traduz o estado retornado pela Evolution para um union type previsivel.
  async getConnectionState(
    instanceName: string,
  ): Promise<ConnectionState> {
    const normalizedInstanceName = ensureNonEmptyString(
      instanceName,
      "Nome da instancia",
    );

    return this.request(
      `/instance/connectionState/${encodeURIComponent(normalizedInstanceName)}`,
      {
        method: "GET",
      },
      (payload) => this.parseConnectionState(payload),
    );
  }

  // Envia uma mensagem de texto simples para um numero via instancia especifica.
  async sendText(
    instanceName: string,
    payload: SendTextPayload,
  ): Promise<void> {
    const normalizedInstanceName = ensureNonEmptyString(
      instanceName,
      "Nome da instancia",
    );
    const number = ensureNonEmptyString(payload.number, "Numero");
    const text = ensureNonEmptyString(payload.text, "Texto");

    if (
      payload.delay !== undefined &&
      (!Number.isFinite(payload.delay) || payload.delay < 0)
    ) {
      throw new Error("Delay invalido. Use um numero maior ou igual a zero.");
    }

    await this.request(
      `/message/sendText/${encodeURIComponent(normalizedInstanceName)}`,
      {
        method: "POST",
        body: JSON.stringify({
          number,
          text,
          ...(payload.delay !== undefined ? { delay: payload.delay } : {}),
        }),
      },
      () => undefined,
    );
  }

  // Remove a instancia quando ela nao deve mais ficar ativa no ambiente.
  async deleteInstance(instanceName: string): Promise<void> {
    const normalizedInstanceName = ensureNonEmptyString(
      instanceName,
      "Nome da instancia",
    );

    await this.request(
      `/instance/delete/${encodeURIComponent(normalizedInstanceName)}`,
      {
        method: "DELETE",
      },
      () => undefined,
    );
  }
}
