import "server-only";

import { and, desc, eq, gte } from "drizzle-orm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { callClaudeVision } from "@/lib/claude";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/onboarding-quiz";
import { documents, sales } from "@/src/db";
import type { DocumentType, Sale } from "@/src/db/types";
import type { SecretaryActionHandler } from "@/src/agents/types";
import { RouterIntent } from "@/src/agents/types";
import { downloadMediaFile } from "@/src/services/whatsapp";
import {
  asDate,
  asNumber,
  asString,
  handlerErrorResult,
  isRecord,
  logHandlerEvent,
  parseClaudeJson,
  parseNumericDbValue,
  toneReply,
} from "@/src/agents/handlers/shared";

const DOCUMENT_EXTRACTION_PROMPT =
  "Extraia os seguintes dados desta nota fiscal/cupom: CNPJ emissor, valor total, itens, data de emissao, numero da nota. Responda em JSON.";

function mapDocumentType(value: unknown): DocumentType {
  const normalized = asString(value)?.toLowerCase();

  switch (normalized) {
    case "nf":
    case "nota":
    case "nota_fiscal":
      return "nf";
    case "cupom":
    case "cupom_fiscal":
      return "cupom";
    case "comprovante":
    case "receipt":
      return "comprovante";
    case "contrato":
      return "contrato";
    default:
      return "outro";
  }
}

function findRecentSaleByAmount(salesRows: Sale[], amount: number) {
  return (
    salesRows.find(
      (sale) => Math.abs(parseNumericDbValue(sale.totalValue) - amount) < 0.01,
    ) ?? null
  );
}

function formatIssueDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return format(value, "dd/MM/yyyy", { locale: ptBR });
}

async function extractVisionData(mediaType: string, base64Data: string) {
  const response = await callClaudeVision({
    prompt: DOCUMENT_EXTRACTION_PROMPT,
    mediaType,
    base64Data,
    maxTokens: 700,
  });

  const parsed = parseClaudeJson<Record<string, unknown>>(response);
  return parsed ?? {};
}

export class DocumentHandler implements SecretaryActionHandler {
  canHandle(intent: RouterIntent) {
    return intent === RouterIntent.DOCUMENT_STORE;
  }

  async handle(context: import("@/src/agents/types").AgentContext) {
    try {
      const extracted = context.extractedData;
      const fileUrl = asString(extracted.fileUrl) ?? context.message.mediaUrl ?? null;

      logHandlerEvent(context, "document_handler_received", {
        messageType: context.message.messageType,
        fileUrl,
      });

      if (!fileUrl) {
        return {
          intent: context.intent,
          confidence: context.confidence,
          actionExecuted: false,
          responseText: toneReply(context.businessProfile?.tone, {
            formal:
              "Recebi o pedido, mas preciso que voce envie a imagem ou o PDF para armazenar.",
            casual:
              "Manda a imagem ou o PDF aqui que eu guardo tudo certinho.",
            tecnico:
              "DOCUMENT_STORE interrompido: mediaUrl ausente para download.",
          }),
          extracted,
        };
      }

      const downloadedFile = await downloadMediaFile(fileUrl);
      let extractedFromVision: Record<string, unknown> = {};

      if (
        context.message.messageType === "image" &&
        downloadedFile.contentType?.startsWith("image/")
      ) {
        extractedFromVision = await extractVisionData(
          downloadedFile.contentType,
          downloadedFile.base64,
        );
      }

      const mergedExtraction = {
        ...extracted,
        ...(isRecord(extractedFromVision) ? extractedFromVision : {}),
      };
      const amount =
        asNumber(mergedExtraction.totalValue) ??
        asNumber(mergedExtraction.amount) ??
        null;
      const issueDate =
        asDate(mergedExtraction.issueDate) ??
        asDate(mergedExtraction.emissionDate) ??
        asDate(mergedExtraction.dataEmissao) ??
        null;

      const recentSales =
        amount === null
          ? []
          : await db
              .select()
              .from(sales)
              .where(
                and(
                  eq(sales.tenantId, context.tenant.id),
                  gte(sales.saleDate, new Date(new Date().setHours(0, 0, 0, 0))),
                ),
              )
              .orderBy(desc(sales.saleDate));
      const matchedSale =
        amount === null ? null : findRecentSaleByAmount(recentSales, amount);

      const [created] = await db
        .insert(documents)
        .values({
          tenantId: context.tenant.id,
          type: mapDocumentType(
            mergedExtraction.documentType ??
              mergedExtraction.tipoDocumento ??
              context.message.messageType,
          ),
          fileUrl: downloadedFile.resolvedUrl,
          extractedData: {
            ...mergedExtraction,
            fileName: downloadedFile.fileName,
            mimeType: downloadedFile.contentType,
            suggestedSaleId: matchedSale?.id ?? null,
          },
          linkedSaleId: null,
          uploadedVia: "whatsapp",
        })
        .returning({ id: documents.id });

      const suggestionText =
        matchedSale && amount !== null
          ? ` Essa NF de ${formatCurrency(amount)} parece ser da venda que voce registrou hoje. Quer que eu vincule?`
          : "";

      return {
        intent: context.intent,
        confidence: context.confidence,
        actionExecuted: true,
        createdRecordId: created.id,
        responseText: toneReply(context.businessProfile?.tone, {
          formal:
            `NF armazenada! 📄 Valor: ${amount !== null ? formatCurrency(amount) : "-"} | ` +
            `Emitida em: ${formatIssueDate(issueDate)}.${suggestionText}`,
          casual:
            `NF armazenada! 📄 Valor: ${amount !== null ? formatCurrency(amount) : "-"} | ` +
            `Emitida em: ${formatIssueDate(issueDate)}.${suggestionText}`,
          tecnico:
            `DOCUMENT_STORE ok | documentId=${created.id} | amount=${amount !== null ? formatCurrency(amount) : "n/a"} | issueDate=${issueDate?.toISOString() ?? "n/a"} | suggestedSaleId=${matchedSale?.id ?? "null"}`,
        }),
        extracted: mergedExtraction,
      };
    } catch (error) {
      return handlerErrorResult(context, error);
    }
  }
}

export const documentHandler = new DocumentHandler();
