import "server-only";

import { randomUUID } from "node:crypto";
import type { QueuedWhatsAppJob } from "@/src/agents/types";
import { routeIncomingMessage } from "@/src/agents/router";

const tenantProcessingChains = new Map<string, Promise<void>>();

export function enqueueWhatsAppMessage(job: QueuedWhatsAppJob) {
  const tenantKey = job.message.tenantId;
  const jobId = randomUUID();
  const previous = tenantProcessingChains.get(tenantKey) ?? Promise.resolve();

  const current = previous
    .catch(() => undefined)
    .then(async () => {
      await routeIncomingMessage(job.message);
    })
    .catch((error) => {
      console.error("Erro ao processar job de WhatsApp:", {
        jobId,
        tenantId: job.message.tenantId,
        messageId: job.message.messageId,
        error,
      });
    })
    .finally(() => {
      if (tenantProcessingChains.get(tenantKey) === current) {
        tenantProcessingChains.delete(tenantKey);
      }
    });

  tenantProcessingChains.set(tenantKey, current);

  return {
    jobId,
    queuedAt: new Date().toISOString(),
  };
}
