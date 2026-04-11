import "server-only";

import { addDays, addWeeks, format, nextDay, parse, set, startOfTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db } from "@/lib/db";
import { normalizeBrazilianPhone } from "@/lib/onboarding-quiz";
import { appointments } from "@/src/db";
import type { AppointmentStatus } from "@/src/db/types";
import type { SecretaryActionHandler } from "@/src/agents/types";
import { RouterIntent } from "@/src/agents/types";
import {
  asDate,
  asString,
  buildMissingFieldsReply,
  handlerErrorResult,
  logHandlerEvent,
  toneReply,
} from "@/src/agents/handlers/shared";

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function parseTime(message: string) {
  const match =
    message.match(/\b(\d{1,2})[:h](\d{2})\b/i) ??
    message.match(/\b(\d{1,2})h\b/i);

  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

function parseWeekday(message: string, baseDate: Date) {
  const normalized = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const weekdays: Array<{ keywords: string[]; day: 0 | 1 | 2 | 3 | 4 | 5 | 6 }> = [
    { keywords: ["domingo"], day: 0 },
    { keywords: ["segunda", "segunda-feira"], day: 1 },
    { keywords: ["terca", "terça", "terca-feira", "terça-feira"], day: 2 },
    { keywords: ["quarta", "quarta-feira"], day: 3 },
    { keywords: ["quinta", "quinta-feira"], day: 4 },
    { keywords: ["sexta", "sexta-feira"], day: 5 },
    { keywords: ["sabado", "sábado"], day: 6 },
  ];

  const match = weekdays.find((weekday) =>
    weekday.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (!match) {
    return null;
  }

  let parsed = nextDay(baseDate, match.day);

  if (normalized.includes("semana que vem")) {
    parsed = addWeeks(parsed, 1);
  }

  return parsed;
}

function parseNaturalDateTime(message: string, referenceDate: Date) {
  const explicitDate =
    asDate(message) ??
    (() => {
      const parsed = parse(message, "dd/MM/yyyy HH:mm", referenceDate, {
        locale: ptBR,
      });
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    })();

  if (explicitDate) {
    return explicitDate;
  }

  const normalized = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const time = parseTime(normalized);
  const applyTime = (date: Date | null) =>
    date && time
      ? set(date, { hours: time.hours, minutes: time.minutes, seconds: 0, milliseconds: 0 })
      : date;

  if (normalized.includes("depois de amanha")) {
    return applyTime(addDays(referenceDate, 2));
  }

  if (normalized.includes("amanha")) {
    return applyTime(startOfTomorrow());
  }

  if (normalized.includes("hoje")) {
    return applyTime(referenceDate);
  }

  const weekday = parseWeekday(normalized, referenceDate);
  if (weekday) {
    return applyTime(weekday);
  }

  const dateMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dateMatch) {
    const day = Number.parseInt(dateMatch[1], 10);
    const month = Number.parseInt(dateMatch[2], 10);
    const year = dateMatch[3]
      ? Number.parseInt(dateMatch[3], 10)
      : referenceDate.getFullYear();
    const parsed = new Date(year, month - 1, day);
    return applyTime(parsed);
  }

  return null;
}

function formatAppointmentDate(value: Date) {
  return capitalize(format(value, "EEEE, dd/MM 'as' HH'h'mm", { locale: ptBR }))
    .replace("h00", "h");
}

export class AppointmentHandler implements SecretaryActionHandler {
  canHandle(intent: RouterIntent) {
    return intent === RouterIntent.APPOINTMENT_SCHEDULE;
  }

  async handle(context: import("@/src/agents/types").AgentContext) {
    try {
      const extracted = context.extractedData;
      const referenceDate = new Date(context.message.receivedAt);
      const title =
        asString(extracted.title) ??
        asString(extracted.subject) ??
        "Compromisso";
      const description = asString(extracted.description) ?? null;
      const customerName =
        asString(extracted.customerName) ?? context.customerName ?? "Cliente";
      const customerPhone =
        normalizeBrazilianPhone(
          asString(extracted.customerPhone) ?? context.customerPhone,
        ) || normalizeBrazilianPhone(context.customerPhone);
      const scheduledAt =
        asDate(extracted.scheduledAt) ??
        asDate(extracted.dateTime) ??
        asDate(extracted.when) ??
        parseNaturalDateTime(context.message.messageContent, referenceDate);

      logHandlerEvent(context, "appointment_handler_received", {
        title,
        scheduledAt: scheduledAt?.toISOString() ?? null,
      });

      if (!scheduledAt) {
        return {
          intent: context.intent,
          confidence: context.confidence,
          actionExecuted: false,
          responseText: buildMissingFieldsReply(context, {
            scheduledAt: true,
          }),
          extracted,
        };
      }

      const reminderAt = asDate(extracted.reminderAt);
      const status: AppointmentStatus = "scheduled";

      const [created] = await db
        .insert(appointments)
        .values({
          tenantId: context.tenant.id,
          title,
          description,
          customerName,
          customerPhone,
          scheduledAt,
          reminderAt,
          status,
        })
        .returning({ id: appointments.id });

      return {
        intent: context.intent,
        confidence: context.confidence,
        actionExecuted: true,
        createdRecordId: created.id,
        responseText: toneReply(context.businessProfile?.tone, {
          formal: `Agendado! 📅 ${title} | ${formatAppointmentDate(scheduledAt)}`,
          casual: `Agendado! 📅 ${title} | ${formatAppointmentDate(scheduledAt)}`,
          tecnico:
            `APPOINTMENT_SCHEDULE ok | title=${title} | scheduledAt=${scheduledAt.toISOString()} | reminder=TODO`,
        }),
        extracted,
      };
    } catch (error) {
      return handlerErrorResult(context, error);
    }
  }
}

export const appointmentHandler = new AppointmentHandler();
