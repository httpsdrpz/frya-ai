import { registerTool } from "@/lib/runtime/tools";
import {
  addDays,
  buildDisplay,
  createPrefixedId,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
  getNumber,
  getOptionalNumber,
  getOptionalString,
  getOptionalStringArray,
  getString,
  okResult,
} from "@/lib/tools/utils";

registerTool({
  agents: ["financeiro"],
  definition: {
    name: "generate_invoice",
    description:
      "Gera uma cobranca mock com vencimento e meios de pagamento sugeridos.",
    parameters: {
      client_name: {
        type: "string",
        description: "Nome do cliente.",
      },
      amount: {
        type: "number",
        description: "Valor da cobranca em reais.",
      },
      description: {
        type: "string",
        description: "Descricao do servico ou produto cobrado.",
      },
      due_days: {
        type: "number",
        description: "Dias ate o vencimento.",
      },
      payment_methods: {
        type: "array",
        description: "Meios de pagamento aceitos.",
        items: { type: "string" },
      },
    },
    requiredParams: ["client_name", "amount", "description"],
  },
  handler: (params) => {
    const clientName = getString(params, "client_name");
    const amount = getNumber(params, "amount");
    const description = getString(params, "description");
    const dueDays = Math.max(1, Math.round(getOptionalNumber(params, "due_days") ?? 7));
    const paymentMethods = getOptionalStringArray(params, "payment_methods") ?? [
      "PIX",
      "Boleto",
    ];
    const dueDate = addDays(new Date(), dueDays);

    return okResult(
      {
        invoiceId: createPrefixedId("INV"),
        clientName,
        amount,
        formattedAmount: formatCurrency(amount),
        description,
        dueDays,
        dueDate: formatDate(dueDate),
        paymentMethods,
      },
      buildDisplay(`Cobranca gerada para ${clientName}.`, [
        `Valor: ${formatCurrency(amount)}`,
        `Vencimento: ${formatDate(dueDate)}`,
        `Meios de pagamento: ${paymentMethods.join(", ")}`,
      ]),
    );
  },
});

registerTool({
  agents: ["financeiro"],
  definition: {
    name: "check_payment_status",
    description:
      "Retorna status mock de pagamentos por periodo para um cliente.",
    parameters: {
      client_name: {
        type: "string",
        description: "Nome do cliente.",
      },
      period: {
        type: "string",
        description: "Periodo opcional de consulta.",
      },
    },
    requiredParams: ["client_name"],
  },
  handler: (params) => {
    const clientName = getString(params, "client_name");
    const period = getOptionalString(params, "period") ?? "mes";
    const mock = {
      pendentes: 2,
      atrasadas: 1,
      pagas: 5,
      totalPendente: 3200,
      totalPago: 11850,
    };

    return okResult(
      {
        clientName,
        period,
        ...mock,
      },
      buildDisplay(`Status financeiro de ${clientName} em ${period}.`, [
        `Pendentes: ${mock.pendentes}`,
        `Atrasadas: ${mock.atrasadas}`,
        `Pagas: ${mock.pagas}`,
        `Total pendente: ${formatCurrency(mock.totalPendente)}`,
        `Total pago: ${formatCurrency(mock.totalPago)}`,
      ]),
    );
  },
});

registerTool({
  agents: ["financeiro"],
  definition: {
    name: "send_payment_reminder",
    description:
      "Monta um lembrete de pagamento com tom adequado ao prazo ou atraso.",
    parameters: {
      client_name: {
        type: "string",
        description: "Nome do cliente.",
      },
      amount: {
        type: "number",
        description: "Valor devido.",
      },
      days_overdue: {
        type: "number",
        description: "Dias em atraso. Negativo significa antes do vencimento.",
      },
      channel: {
        type: "string",
        description: "Canal de envio.",
        enum: ["whatsapp", "email", "sms"],
      },
      tone: {
        type: "string",
        description: "Tom do lembrete.",
        enum: ["amigavel", "firme", "formal"],
      },
    },
    requiredParams: ["client_name", "amount", "days_overdue", "channel"],
  },
  handler: (params) => {
    const clientName = getString(params, "client_name");
    const amount = getNumber(params, "amount");
    const daysOverdue = Math.round(getNumber(params, "days_overdue"));
    const channel = getString(params, "channel");
    const explicitTone = getOptionalString(params, "tone");

    const tone =
      explicitTone ??
      (daysOverdue < 0
        ? "amigavel"
        : daysOverdue <= 7
          ? "amigavel"
          : daysOverdue <= 30
            ? "firme"
            : "formal");

    const timingLine =
      daysOverdue < 0
        ? `faltam ${Math.abs(daysOverdue)} dia(s) para o vencimento`
        : daysOverdue === 0
          ? "vence hoje"
          : `esta em atraso ha ${daysOverdue} dia(s)`;

    const preview =
      tone === "formal"
        ? `Prezado(a) ${clientName}, identificamos que o valor de ${formatCurrency(amount)} ${timingLine}. Permanecemos a disposicao para regularizacao.`
        : tone === "firme"
          ? `${clientName}, o valor de ${formatCurrency(amount)} ${timingLine}. Precisamos da regularizacao para manter o fluxo em dia.`
          : `${clientName}, passando para lembrar que o valor de ${formatCurrency(amount)} ${timingLine}. Se precisar, posso reenviar os dados de pagamento.`;

    return okResult(
      {
        reminderId: createPrefixedId("REM"),
        clientName,
        amount,
        channel,
        tone,
        preview,
      },
      buildDisplay(`Lembrete de pagamento pronto para ${clientName}.`, [
        `Canal: ${channel}`,
        `Tom: ${tone}`,
        `Mensagem: ${preview}`,
      ]),
    );
  },
});

registerTool({
  agents: ["financeiro"],
  definition: {
    name: "register_payment",
    description:
      "Registra um pagamento recebido para conferencias posteriores.",
    parameters: {
      client_name: {
        type: "string",
        description: "Nome do cliente.",
      },
      amount: {
        type: "number",
        description: "Valor recebido.",
      },
      payment_method: {
        type: "string",
        description: "Metodo de pagamento.",
        enum: ["pix", "boleto", "cartao", "transferencia", "dinheiro"],
      },
      invoice_id: {
        type: "string",
        description: "ID opcional da cobranca.",
      },
      notes: {
        type: "string",
        description: "Observacoes adicionais.",
      },
    },
    requiredParams: ["client_name", "amount", "payment_method"],
  },
  handler: (params) => {
    const clientName = getString(params, "client_name");
    const amount = getNumber(params, "amount");
    const paymentMethod = getString(params, "payment_method");
    const invoiceId = getOptionalString(params, "invoice_id");
    const notes = getOptionalString(params, "notes");

    return okResult(
      {
        receiptId: createPrefixedId("PAY"),
        clientName,
        amount,
        paymentMethod,
        invoiceId: invoiceId ?? null,
        notes: notes ?? null,
        receivedAt: formatDateTime(new Date()),
      },
      buildDisplay(`Pagamento registrado para ${clientName}.`, [
        `Valor: ${formatCurrency(amount)}`,
        `Metodo: ${paymentMethod}`,
        `Fatura: ${invoiceId ?? "nao informada"}`,
      ]),
    );
  },
});

registerTool({
  agents: ["financeiro"],
  definition: {
    name: "financial_summary",
    description:
      "Retorna um resumo mock do financeiro com recebido, pendente e atraso.",
    parameters: {
      period: {
        type: "string",
        description: "Periodo de referencia.",
        enum: ["semana", "mes", "trimestre"],
      },
    },
    requiredParams: ["period"],
  },
  handler: (params) => {
    const period = getString(params, "period");
    const dataset = {
      semana: {
        recebido: 18500,
        pendente: 4200,
        atrasado: 1300,
        inadimplencia: 6.6,
      },
      mes: {
        recebido: 78400,
        pendente: 12350,
        atrasado: 6100,
        inadimplencia: 7.8,
      },
      trimestre: {
        recebido: 228500,
        pendente: 29800,
        atrasado: 16900,
        inadimplencia: 7.4,
      },
    } as const;

    const summary = dataset[period as keyof typeof dataset];

    return okResult(
      {
        period,
        ...summary,
      },
      buildDisplay(`Resumo financeiro de ${period}.`, [
        `Recebido: ${formatCurrency(summary.recebido)}`,
        `Pendente: ${formatCurrency(summary.pendente)}`,
        `Atrasado: ${formatCurrency(summary.atrasado)}`,
        `Inadimplencia: ${formatPercent(summary.inadimplencia)}`,
      ]),
    );
  },
});
