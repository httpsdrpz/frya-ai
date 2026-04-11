import "server-only";

import { db } from "@/lib/db";
import { formatCurrency, normalizeBrazilianPhone } from "@/lib/onboarding-quiz";
import { sales } from "@/src/db";
import type { SecretaryActionHandler } from "@/src/agents/types";
import { RouterIntent } from "@/src/agents/types";
import {
  asInteger,
  asNumber,
  asString,
  buildMissingFieldsReply,
  fuzzyMatchBusinessProduct,
  handlerErrorResult,
  logHandlerEvent,
  mapSalePaymentStatus,
  toNumericString,
  toneReply,
} from "@/src/agents/handlers/shared";

export class SaleHandler implements SecretaryActionHandler {
  canHandle(intent: RouterIntent) {
    return intent === RouterIntent.SALE_REGISTER;
  }

  async handle(context: import("@/src/agents/types").AgentContext) {
    try {
      const extracted = context.extractedData;
      const rawProduct =
        asString(extracted.productOrService) ?? asString(extracted.product);
      const quantity = asInteger(extracted.quantity) ?? 1;
      const matchedProduct = fuzzyMatchBusinessProduct(
        rawProduct,
        context.businessProfile?.products,
      );
      const productName = matchedProduct?.product.name ?? rawProduct;
      const unitPrice =
        asNumber(extracted.unitPrice) ??
        matchedProduct?.product.price ??
        null;
      const totalValue =
        asNumber(extracted.totalValue) ??
        (unitPrice !== null ? unitPrice * quantity : null);
      const customerName =
        asString(extracted.customerName) ?? context.customerName ?? null;
      const paymentMethod = asString(extracted.paymentMethod);

      const missingProduct = !productName;
      const missingValue = totalValue === null;
      const missingCustomer = !customerName;
      const missingPayment = !paymentMethod;

      logHandlerEvent(context, "sale_handler_received", {
        productName,
        quantity,
        totalValue,
        customerName,
        paymentMethod,
        fuzzyMatchScore: matchedProduct?.score ?? null,
      });

      if (missingProduct || missingValue || missingCustomer || missingPayment) {
        return {
          intent: context.intent,
          confidence: context.confidence,
          actionExecuted: false,
          responseText: buildMissingFieldsReply(
            context,
            {
              product: missingProduct,
              totalValue: missingValue,
              customerName: missingCustomer,
              paymentMethod: missingPayment,
            },
            {
              productName,
              totalValue,
              customerName,
            },
          ),
          extracted,
        };
      }

      const computedUnitPrice = unitPrice ?? totalValue / quantity;
      const customerPhone =
        normalizeBrazilianPhone(
          asString(extracted.customerPhone) ?? context.customerPhone,
        ) || normalizeBrazilianPhone(context.customerPhone);
      const saleDateRaw = asString(extracted.saleDate);
      const saleDate = saleDateRaw ? new Date(saleDateRaw) : new Date(context.message.receivedAt);
      const installments = asInteger(extracted.installments) ?? 1;
      const notes = asString(extracted.notes) ?? null;
      const paymentStatus = mapSalePaymentStatus(extracted.paymentStatus);

      const [created] = await db
        .insert(sales)
        .values({
          tenantId: context.tenant.id,
          customerName,
          customerPhone,
          productOrService: productName,
          quantity,
          unitPrice: toNumericString(computedUnitPrice),
          totalValue: toNumericString(totalValue),
          paymentMethod,
          paymentStatus,
          installments,
          notes,
          saleDate,
        })
        .returning({ id: sales.id });

      logHandlerEvent(context, "sale_handler_completed", {
        saleId: created.id,
        productName,
        totalValue,
        paymentMethod,
      });

      return {
        intent: context.intent,
        confidence: context.confidence,
        actionExecuted: true,
        createdRecordId: created.id,
        responseText: toneReply(context.businessProfile?.tone, {
          formal:
            `Venda registrada! ${quantity}x ${productName} = ${formatCurrency(totalValue)} | ` +
            `Cliente: ${customerName} | ${paymentMethod}`,
          casual:
            `Venda registrada! 📊 ${quantity}x ${productName} = ${formatCurrency(totalValue)} | ` +
            `Cliente: ${customerName} | ${paymentMethod}`,
          tecnico:
            `SALE_REGISTER ok | qty=${quantity} | item=${productName} | total=${formatCurrency(totalValue)} | cliente=${customerName} | pagamento=${paymentMethod}`,
        }),
        extracted,
      };
    } catch (error) {
      return handlerErrorResult(context, error);
    }
  }
}

export const saleHandler = new SaleHandler();
