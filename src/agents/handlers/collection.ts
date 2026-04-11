import "server-only";

import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { formatCurrency, normalizeBrazilianPhone } from "@/lib/onboarding-quiz";
import { collections, sales } from "@/src/db";
import type { CollectionStatus, Sale } from "@/src/db/types";
import type { SecretaryActionHandler } from "@/src/agents/types";
import { RouterIntent } from "@/src/agents/types";
import {
  asDate,
  asNumber,
  asString,
  buildMissingFieldsReply,
  handlerErrorResult,
  logHandlerEvent,
  parseNumericDbValue,
  toNumericString,
  toneReply,
} from "@/src/agents/handlers/shared";

function normalizeComparable(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectCollectionMode(messageContent: string, extracted: Record<string, unknown>) {
  const explicitMode = asString(extracted.mode)?.toLowerCase();
  const lowered = messageContent.toLowerCase();

  if (
    explicitMode === "query" ||
    /\b(quantas|quais|listar|listando|pendentes|pendencia|totalizando|consultar)\b/i.test(
      lowered,
    )
  ) {
    return "query";
  }

  if (
    explicitMode === "mark_paid" ||
    /\b(pago|paga|quitou|recebi|recebido|marcar como paga)\b/i.test(lowered)
  ) {
    return "mark_paid";
  }

  return "register";
}

function findMatchingSale(
  salesRows: Sale[],
  customerName: string,
  amount: number,
) {
  const normalizedCustomer = normalizeComparable(customerName);

  return (
    salesRows.find((sale) => {
      const saleCustomer = normalizeComparable(sale.customerName);
      const sameCustomer =
        normalizedCustomer && saleCustomer
          ? saleCustomer.includes(normalizedCustomer) ||
            normalizedCustomer.includes(saleCustomer)
          : false;
      const sameAmount =
        Math.abs(parseNumericDbValue(sale.totalValue) - amount) < 0.01;

      return sameCustomer && sameAmount;
    }) ?? null
  );
}

export class CollectionHandler implements SecretaryActionHandler {
  canHandle(intent: RouterIntent) {
    return intent === RouterIntent.COLLECTION_TRACK;
  }

  async handle(context: import("@/src/agents/types").AgentContext) {
    try {
      const extracted = context.extractedData;
      const mode = detectCollectionMode(context.message.messageContent, extracted);

      logHandlerEvent(context, "collection_handler_received", {
        mode,
        extracted,
      });

      if (mode === "query") {
        const pendingRows = await db
          .select({
            status: collections.status,
            amount: collections.amount,
          })
          .from(collections)
          .where(eq(collections.tenantId, context.tenant.id));

        const pendingOnly = pendingRows.filter((row) => row.status === "pending");
        const paidOnly = pendingRows.filter((row) => row.status === "paid");
        const pendingTotal = pendingOnly.reduce(
          (sum, row) => sum + parseNumericDbValue(row.amount),
          0,
        );

        return {
          intent: context.intent,
          confidence: context.confidence,
          actionExecuted: true,
          responseText: toneReply(context.businessProfile?.tone, {
            formal:
              `Voce tem ${pendingOnly.length} cobrancas pendentes totalizando ${formatCurrency(pendingTotal)}. ` +
              `${paidOnly.length} ja foram marcadas como pagas.`,
            casual:
              `Voce tem ${pendingOnly.length} cobrancas pendentes somando ${formatCurrency(pendingTotal)}. ` +
              `${paidOnly.length} ja estao pagas.`,
            tecnico:
              `COLLECTION_TRACK query | pending_count=${pendingOnly.length} | pending_total=${formatCurrency(pendingTotal)} | paid_count=${paidOnly.length}`,
          }),
          extracted,
        };
      }

      if (mode === "mark_paid") {
        const customerName =
          asString(extracted.customerName) ?? context.customerName ?? null;
        const amount = asNumber(extracted.amount);
        const customerPhone =
          normalizeBrazilianPhone(
            asString(extracted.customerPhone) ?? context.customerPhone,
          ) || normalizeBrazilianPhone(context.customerPhone);

        const pendingRows = await db
          .select()
          .from(collections)
          .where(eq(collections.tenantId, context.tenant.id))
          .orderBy(desc(collections.createdAt));

        const match =
          pendingRows.find((row) => {
            if (row.status === "paid") {
              return false;
            }

            const samePhone =
              customerPhone && normalizeBrazilianPhone(row.customerPhone) === customerPhone;
            const sameCustomer = customerName
              ? normalizeComparable(row.customerName).includes(
                  normalizeComparable(customerName),
                )
              : false;
            const sameAmount =
              amount === null
                ? true
                : Math.abs(parseNumericDbValue(row.amount) - amount) < 0.01;

            return (samePhone || sameCustomer) && sameAmount;
          }) ?? null;

        if (!match) {
          return {
            intent: context.intent,
            confidence: context.confidence,
            actionExecuted: false,
            responseText: toneReply(context.businessProfile?.tone, {
              formal:
                "Nao encontrei uma cobranca pendente com esses dados para marcar como paga.",
              casual:
                "Nao achei essa cobranca por aqui pra marcar como paga ainda.",
              tecnico:
                "COLLECTION_TRACK mark_paid sem match de cobranca pendente.",
            }),
            extracted,
          };
        }

        await db
          .update(collections)
          .set({
            status: "paid" satisfies CollectionStatus,
          })
          .where(eq(collections.id, match.id));

        return {
          intent: context.intent,
          confidence: context.confidence,
          actionExecuted: true,
          createdRecordId: match.id,
          responseText: toneReply(context.businessProfile?.tone, {
            formal: `Beleza, marquei a cobranca de ${match.customerName} como paga.`,
            casual: `Beleza, marquei a cobranca do ${match.customerName} como paga ✅`,
            tecnico: `COLLECTION_TRACK mark_paid ok | collectionId=${match.id}`,
          }),
          extracted,
        };
      }

      const amount = asNumber(extracted.amount);
      const dueDate = asDate(extracted.dueDate);
      const customerName =
        asString(extracted.customerName) ?? context.customerName ?? null;

      if (amount === null || !dueDate || !customerName) {
        return {
          intent: context.intent,
          confidence: context.confidence,
          actionExecuted: false,
          responseText: buildMissingFieldsReply(context, {
            customerName: !customerName,
            totalValue: amount === null,
            dueDate: !dueDate,
          }),
          extracted,
        };
      }

      const customerPhone =
        normalizeBrazilianPhone(
          asString(extracted.customerPhone) ?? context.customerPhone,
        ) || normalizeBrazilianPhone(context.customerPhone);
      const notes = asString(extracted.notes) ?? null;
      const status: CollectionStatus = dueDate < new Date() ? "overdue" : "pending";

      const recentSales = await db
        .select()
        .from(sales)
        .where(
          and(
            eq(sales.tenantId, context.tenant.id),
            gte(sales.saleDate, new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)),
          ),
        )
        .orderBy(desc(sales.saleDate));

      const matchedSale = findMatchingSale(recentSales, customerName, amount);

      const [created] = await db
        .insert(collections)
        .values({
          tenantId: context.tenant.id,
          linkedSaleId: matchedSale?.id ?? null,
          customerName,
          customerPhone,
          amount: toNumericString(amount),
          dueDate,
          status,
          notes,
        })
        .returning({ id: collections.id });

      return {
        intent: context.intent,
        confidence: context.confidence,
        actionExecuted: true,
        createdRecordId: created.id,
        responseText: toneReply(context.businessProfile?.tone, {
          formal:
            `Cobranca registrada para ${customerName} no valor de ${formatCurrency(amount)}.` +
            (matchedSale ? " Encontrei e vinculei automaticamente a venda correspondente." : ""),
          casual:
            `Cobranca registrada! 💰 ${customerName} | ${formatCurrency(amount)}` +
            (matchedSale ? " Ja vinculei com a venda correspondente." : ""),
          tecnico:
            `COLLECTION_TRACK register ok | amount=${formatCurrency(amount)} | linkedSaleId=${matchedSale?.id ?? "null"}`,
        }),
        extracted,
      };
    } catch (error) {
      return handlerErrorResult(context, error);
    }
  }
}

export const collectionHandler = new CollectionHandler();
