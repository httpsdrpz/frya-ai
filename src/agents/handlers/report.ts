import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";
import { addDays, startOfDay, startOfMonth } from "date-fns";
import { callClaude } from "@/lib/claude";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/onboarding-quiz";
import { appointments, collections, documents, sales } from "@/src/db";
import type { SecretaryActionHandler } from "@/src/agents/types";
import { RouterIntent } from "@/src/agents/types";
import {
  asString,
  handlerErrorResult,
  logHandlerEvent,
  parseNumericDbValue,
} from "@/src/agents/handlers/shared";

function resolvePeriod(messageContent: string, extracted: Record<string, unknown>) {
  const explicit = asString(extracted.period)?.toLowerCase();
  const lowered = messageContent.toLowerCase();

  if (explicit === "hoje" || explicit === "today" || lowered.includes("hoje")) {
    return {
      label: "hoje",
      start: startOfDay(new Date()),
    };
  }

  if (
    explicit === "semana" ||
    explicit === "week" ||
    lowered.includes("semana")
  ) {
    return {
      label: "semana",
      start: addDays(startOfDay(new Date()), -7),
    };
  }

  return {
    label: "mes",
    start: startOfMonth(new Date()),
  };
}

function fallbackReportMessage(args: {
  label: string;
  salesCount: number;
  salesTotal: number;
  documentsCount: number;
  pendingCollectionsCount: number;
  pendingCollectionsTotal: number;
  paidCollectionsCount: number;
  upcomingAppointments: number;
}) {
  return (
    `📈 Seu ${args.label} ate agora:\n` +
    `• ${args.salesCount} vendas = ${formatCurrency(args.salesTotal)}\n` +
    `• ${args.documentsCount} NFs armazenadas\n` +
    `• ${args.pendingCollectionsCount} cobrancas pendentes (${formatCurrency(args.pendingCollectionsTotal)})\n` +
    `• ${args.paidCollectionsCount} cobrancas pagas\n` +
    `• ${args.upcomingAppointments} compromissos essa semana`
  );
}

export class ReportHandler implements SecretaryActionHandler {
  canHandle(intent: RouterIntent) {
    return intent === RouterIntent.REPORT_REQUEST;
  }

  async handle(context: import("@/src/agents/types").AgentContext) {
    try {
      const period = resolvePeriod(
        context.message.messageContent,
        context.extractedData,
      );

      logHandlerEvent(context, "report_handler_received", {
        period: period.label,
      });

      const [salesRows, documentRows, collectionRows, upcomingAppointments] =
        await Promise.all([
          db
            .select({
              totalValue: sales.totalValue,
            })
            .from(sales)
            .where(
              and(
                eq(sales.tenantId, context.tenant.id),
                gte(sales.saleDate, period.start),
              ),
            ),
          db
            .select({
              count: sql<number>`count(*)`,
            })
            .from(documents)
            .where(
              and(
                eq(documents.tenantId, context.tenant.id),
                gte(documents.createdAt, period.start),
              ),
            ),
          db
            .select({
              status: collections.status,
              amount: collections.amount,
            })
            .from(collections)
            .where(eq(collections.tenantId, context.tenant.id)),
          db
            .select({
              count: sql<number>`count(*)`,
            })
            .from(appointments)
            .where(
              and(
                eq(appointments.tenantId, context.tenant.id),
                gte(appointments.scheduledAt, startOfDay(new Date())),
              ),
            ),
        ]);

      const salesTotal = salesRows.reduce(
        (sum, row) => sum + parseNumericDbValue(row.totalValue),
        0,
      );
      const pendingCollections = collectionRows.filter((row) => row.status === "pending");
      const paidCollections = collectionRows.filter((row) => row.status === "paid");
      const pendingCollectionsTotal = pendingCollections.reduce(
        (sum, row) => sum + parseNumericDbValue(row.amount),
        0,
      );
      const summary = {
        period: period.label,
        tone: context.businessProfile?.tone ?? "casual",
        tenantName: context.tenant.name,
        totalSalesCount: salesRows.length,
        totalSalesValue: salesTotal,
        documentsStored: documentRows[0]?.count ?? 0,
        pendingCollectionsCount: pendingCollections.length,
        pendingCollectionsValue: pendingCollectionsTotal,
        paidCollectionsCount: paidCollections.length,
        upcomingAppointmentsCount: upcomingAppointments[0]?.count ?? 0,
      };

      const reportPrompt =
        "Monte uma resposta curta para WhatsApp, em portugues do Brasil, usando o tom informado. " +
        "Seja legivel e conversacional. Comece com um titulo curto e use bullets simples. " +
        "Nao invente dados. Dados:\n" +
        JSON.stringify(summary, null, 2);

      let responseText: string | null = null;

      try {
        responseText = await callClaude(
          [
            {
              role: "user",
              content: reportPrompt,
            },
          ],
          "Voce escreve relatorios curtos e legiveis para WhatsApp de pequenos negocios.",
          350,
        );
      } catch (error) {
        logHandlerEvent(context, "report_handler_claude_fallback", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return {
        intent: context.intent,
        confidence: context.confidence,
        actionExecuted: true,
        responseText:
          responseText?.trim() ||
          fallbackReportMessage({
            label: period.label,
            salesCount: salesRows.length,
            salesTotal,
            documentsCount: documentRows[0]?.count ?? 0,
            pendingCollectionsCount: pendingCollections.length,
            pendingCollectionsTotal,
            paidCollectionsCount: paidCollections.length,
            upcomingAppointments: upcomingAppointments[0]?.count ?? 0,
          }),
        extracted: context.extractedData,
      };
    } catch (error) {
      return handlerErrorResult(context, error);
    }
  }
}

export const reportHandler = new ReportHandler();
