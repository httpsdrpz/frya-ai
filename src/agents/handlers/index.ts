import "server-only";

import type { SecretaryActionHandler } from "@/src/agents/types";
import { RouterIntent } from "@/src/agents/types";
import { appointmentHandler } from "@/src/agents/handlers/appointment";
import { collectionHandler } from "@/src/agents/handlers/collection";
import { documentHandler } from "@/src/agents/handlers/document";
import { reportHandler } from "@/src/agents/handlers/report";
import { saleHandler } from "@/src/agents/handlers/sale";

const HANDLERS: SecretaryActionHandler[] = [
  saleHandler,
  documentHandler,
  collectionHandler,
  appointmentHandler,
  reportHandler,
];

export function getHandler(intent: RouterIntent) {
  return HANDLERS.find((handler) => handler.canHandle(intent)) ?? null;
}

export {
  appointmentHandler,
  collectionHandler,
  documentHandler,
  reportHandler,
  saleHandler,
};
