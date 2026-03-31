import { registerTool } from "@/lib/runtime/tools";
import {
  addHours,
  buildDisplay,
  clamp,
  createPrefixedId,
  formatDateTime,
  getOptionalNumber,
  getOptionalString,
  getString,
  getStringArray,
  normalizeText,
  okResult,
} from "@/lib/tools/utils";

const slaHoursByPriority = {
  baixa: 48,
  media: 24,
  alta: 8,
  critica: 2,
} as const;

const faqEntries = [
  {
    category: "horario",
    keywords: ["horario", "atendimento", "funciona", "aberto"],
    answer:
      "Nosso atendimento opera em horario comercial. Se houver plantao ou excecao, confirme no contexto da empresa antes de prometer.",
  },
  {
    category: "prazo",
    keywords: ["prazo", "entrega", "implantacao", "retorno"],
    answer:
      "Explique o prazo previsto, destaque dependencias e confirme se existe alguma etapa pendente antes de assumir uma data.",
  },
  {
    category: "cancelamento",
    keywords: ["cancel", "encerrar", "desistir", "churn"],
    answer:
      "Ao tratar cancelamento, reconheca o contexto, identifique motivo-raiz e abra escalonamento se houver risco relevante de churn.",
  },
  {
    category: "pagamento",
    keywords: ["pagamento", "boleto", "pix", "fatura", "nota"],
    answer:
      "Questoes financeiras devem ser respondidas com dados confirmados. Se faltar informacao, use handoff para o agente financeiro.",
  },
] as const;

registerTool({
  agents: ["cs"],
  definition: {
    name: "create_ticket",
    description:
      "Cria um ticket de atendimento com prioridade, categoria e SLA calculado.",
    parameters: {
      client_name: {
        type: "string",
        description: "Nome do cliente.",
      },
      category: {
        type: "string",
        description: "Categoria do atendimento.",
        enum: [
          "duvida",
          "problema_tecnico",
          "reclamacao",
          "solicitacao",
          "sugestao",
          "cancelamento",
        ],
      },
      priority: {
        type: "string",
        description: "Prioridade do ticket.",
        enum: ["baixa", "media", "alta", "critica"],
      },
      description: {
        type: "string",
        description: "Descricao do caso.",
      },
      channel: {
        type: "string",
        description: "Canal de origem.",
      },
    },
    requiredParams: [
      "client_name",
      "category",
      "priority",
      "description",
      "channel",
    ],
  },
  handler: (params) => {
    const clientName = getString(params, "client_name");
    const category = getString(params, "category");
    const priority = getString(
      params,
      "priority",
    ) as keyof typeof slaHoursByPriority;
    const description = getString(params, "description");
    const channel = getString(params, "channel");
    const createdAt = new Date();
    const slaDueAt = addHours(createdAt, slaHoursByPriority[priority]);

    return okResult(
      {
        ticketId: createPrefixedId("TKT"),
        clientName,
        category,
        priority,
        channel,
        description,
        createdAt: formatDateTime(createdAt),
        slaHours: slaHoursByPriority[priority],
        slaDueAt: formatDateTime(slaDueAt),
      },
      buildDisplay(`Ticket criado para ${clientName}.`, [
        `Categoria: ${category}`,
        `Prioridade: ${priority}`,
        `SLA: ${slaHoursByPriority[priority]}h`,
        `Vencimento do SLA: ${formatDateTime(slaDueAt)}`,
      ]),
    );
  },
});

registerTool({
  agents: ["cs"],
  definition: {
    name: "escalate_ticket",
    description:
      "Escalona um caso para outra fila quando houver risco ou complexidade.",
    parameters: {
      client_name: {
        type: "string",
        description: "Nome do cliente.",
      },
      reason: {
        type: "string",
        description: "Motivo do escalonamento.",
        enum: [
          "complexidade_tecnica",
          "insatisfacao_grave",
          "pedido_cancelamento",
          "solicitacao_especial",
          "fora_do_escopo",
          "risco_churn",
        ],
      },
      context_summary: {
        type: "string",
        description: "Resumo do contexto atual.",
      },
      suggested_resolution: {
        type: "string",
        description: "Resolucao sugerida para o proximo time.",
      },
    },
    requiredParams: [
      "client_name",
      "reason",
      "context_summary",
      "suggested_resolution",
    ],
  },
  handler: (params) => {
    const clientName = getString(params, "client_name");
    const reason = getString(params, "reason");
    const contextSummary = getString(params, "context_summary");
    const suggestedResolution = getString(params, "suggested_resolution");

    const destination =
      reason === "complexidade_tecnica"
        ? "time tecnico"
        : reason === "pedido_cancelamento" || reason === "risco_churn"
          ? "lideranca de CS"
          : "operacao especializada";

    return okResult(
      {
        escalationId: createPrefixedId("ESC"),
        clientName,
        reason,
        destination,
        contextSummary,
        suggestedResolution,
      },
      buildDisplay(`Ticket de ${clientName} escalonado.`, [
        `Destino: ${destination}`,
        `Motivo: ${reason}`,
        `Resolucao sugerida: ${suggestedResolution}`,
      ]),
    );
  },
});

registerTool({
  agents: ["cs"],
  definition: {
    name: "search_faq",
    description:
      "Busca respostas simples em uma base de FAQ mock por palavra-chave.",
    parameters: {
      query: {
        type: "string",
        description: "Pergunta ou termos pesquisados.",
      },
      category: {
        type: "string",
        description: "Categoria opcional do FAQ.",
      },
    },
    requiredParams: ["query"],
  },
  handler: (params) => {
    const query = getString(params, "query");
    const category = getOptionalString(params, "category");
    const normalizedQuery = normalizeText(query);

    const matches = faqEntries
      .filter((entry) => {
        if (category && entry.category !== category) {
          return false;
        }

        return entry.keywords.some((keyword) => normalizedQuery.includes(keyword));
      })
      .slice(0, 3)
      .map((entry) => ({
        category: entry.category,
        answer: entry.answer,
      }));

    return okResult(
      {
        query,
        category: category ?? null,
        matches,
      },
      matches.length
        ? buildDisplay("FAQ encontrado.", [
            `Categoria principal: ${matches[0]?.category ?? "geral"}`,
            `Resposta: ${matches[0]?.answer ?? ""}`,
          ])
        : "Nenhum FAQ relevante encontrado; siga com resposta contextual ou escalonamento.",
    );
  },
});

registerTool({
  agents: ["cs"],
  definition: {
    name: "detect_churn_risk",
    description:
      "Calcula risco de churn com base em sinais, sentimento e tempo de contrato.",
    parameters: {
      client_name: {
        type: "string",
        description: "Nome do cliente.",
      },
      signals: {
        type: "array",
        description: "Sinais observados na conta.",
        items: { type: "string" },
      },
      sentiment: {
        type: "string",
        description: "Sentimento atual percebido.",
        enum: ["positivo", "neutro", "frustrado", "irritado"],
      },
      tenure_months: {
        type: "number",
        description: "Tempo de relacionamento em meses.",
      },
    },
    requiredParams: ["client_name", "signals", "sentiment"],
  },
  handler: (params) => {
    const clientName = getString(params, "client_name");
    const signals = getStringArray(params, "signals");
    const sentiment = getString(params, "sentiment");
    const tenureMonths = getOptionalNumber(params, "tenure_months");

    let riskScore = signals.length * 9;

    if (sentiment === "frustrado") {
      riskScore += 20;
    } else if (sentiment === "irritado") {
      riskScore += 32;
    } else if (sentiment === "neutro") {
      riskScore += 8;
    }

    const normalizedSignals = signals.map((signal) => normalizeText(signal));

    if (normalizedSignals.some((signal) => signal.includes("cancel"))) {
      riskScore += 18;
    }

    if (normalizedSignals.some((signal) => signal.includes("sem uso"))) {
      riskScore += 12;
    }

    if (normalizedSignals.some((signal) => signal.includes("atraso"))) {
      riskScore += 10;
    }

    if (tenureMonths !== undefined && tenureMonths < 3) {
      riskScore += 8;
    }

    if (tenureMonths !== undefined && tenureMonths > 12 && sentiment !== "positivo") {
      riskScore += 6;
    }

    const finalScore = clamp(Math.round(riskScore), 0, 100);
    const riskLevel =
      finalScore >= 70 ? "alto" : finalScore >= 40 ? "medio" : "baixo";
    const actions =
      riskLevel === "alto"
        ? [
            "Acionar lideranca rapidamente.",
            "Revisar historico completo da conta.",
            "Propor plano de retencao com prazo e responsavel.",
          ]
        : riskLevel === "medio"
          ? [
              "Fazer contato proativo com plano de correcao.",
              "Acompanhar em 48h.",
            ]
          : ["Manter acompanhamento normal e confirmar satisfacao."];

    return okResult(
      {
        clientName,
        finalScore,
        riskLevel,
        actions,
      },
      buildDisplay(`Risco de churn ${riskLevel} para ${clientName}.`, [
        `Score: ${finalScore}/100`,
        `Acoes: ${actions.join(" | ")}`,
      ]),
    );
  },
});

registerTool({
  agents: ["cs"],
  definition: {
    name: "log_feedback",
    description:
      "Registra feedback de cliente para analise posterior do time.",
    parameters: {
      client_name: {
        type: "string",
        description: "Nome do cliente.",
      },
      type: {
        type: "string",
        description: "Tipo do feedback.",
        enum: ["elogio", "critica", "sugestao", "bug_report"],
      },
      content: {
        type: "string",
        description: "Conteudo do feedback.",
      },
      area: {
        type: "string",
        description: "Area impactada opcional.",
      },
    },
    requiredParams: ["client_name", "type", "content"],
  },
  handler: (params) => {
    const clientName = getString(params, "client_name");
    const type = getString(params, "type");
    const content = getString(params, "content");
    const area = getOptionalString(params, "area");

    return okResult(
      {
        feedbackId: createPrefixedId("FDB"),
        clientName,
        type,
        content,
        area: area ?? null,
        loggedAt: formatDateTime(new Date()),
        persistence: "TODO: persistir no repositorio de feedback.",
      },
      buildDisplay(`Feedback registrado para ${clientName}.`, [
        `Tipo: ${type}`,
        `Area: ${area ?? "geral"}`,
        `Conteudo: ${content}`,
      ]),
    );
  },
});
