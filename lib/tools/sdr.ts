import { registerTool } from "@/lib/runtime/tools";
import {
  addHours,
  buildDisplay,
  clamp,
  createPrefixedId,
  formatDateTime,
  formatPercent,
  getBoolean,
  getNumber,
  getOptionalString,
  getString,
  getStringArray,
  okResult,
} from "@/lib/tools/utils";

const budgetWeights = {
  definido: 20,
  explorando: 12,
  sem_orcamento: 0,
  desconhecido: 6,
} as const;

const urgencyWeights = {
  imediata: 20,
  curto_prazo: 12,
  explorando: 5,
} as const;

registerTool({
  agents: ["sdr"],
  definition: {
    name: "qualify_lead",
    description:
      "Qualifica um lead com base em fit, momento de compra e sinais de decisao.",
    parameters: {
      lead_name: {
        type: "string",
        description: "Nome do lead ou empresa.",
      },
      budget_signal: {
        type: "string",
        description: "Nivel de sinal de orcamento.",
        enum: ["definido", "explorando", "sem_orcamento", "desconhecido"],
      },
      urgency: {
        type: "string",
        description: "Janela de compra percebida.",
        enum: ["imediata", "curto_prazo", "explorando"],
      },
      decision_maker: {
        type: "boolean",
        description: "Se a pessoa ja participa da decisao de compra.",
      },
      fit_score: {
        type: "number",
        description: "Nota de fit de 1 a 10.",
      },
      notes: {
        type: "string",
        description: "Notas complementares da conversa.",
      },
    },
    requiredParams: [
      "lead_name",
      "budget_signal",
      "urgency",
      "decision_maker",
      "fit_score",
      "notes",
    ],
  },
  handler: (params) => {
    const leadName = getString(params, "lead_name");
    const budgetSignal = getString(
      params,
      "budget_signal",
    ) as keyof typeof budgetWeights;
    const urgency = getString(params, "urgency") as keyof typeof urgencyWeights;
    const decisionMaker = getBoolean(params, "decision_maker");
    const fitScore = clamp(getNumber(params, "fit_score"), 1, 10);
    const notes = getString(params, "notes");

    let score = fitScore * 5 + budgetWeights[budgetSignal] + urgencyWeights[urgency];

    if (decisionMaker) {
      score += 10;
    }

    if (/prazo|urgente|prioridade|meta|fechar/i.test(notes)) {
      score += 8;
    }

    if (/concorrente|roi|resultado|demora/i.test(notes)) {
      score += 5;
    }

    const qualificationScore = clamp(Math.round(score), 0, 100);
    const classification =
      qualificationScore >= 75 ? "hot" : qualificationScore >= 50 ? "warm" : "cold";
    const nextStep =
      classification === "hot"
        ? "Agendar reuniao de diagnostico ou demonstracao nas proximas 24h."
        : classification === "warm"
          ? "Executar follow-up consultivo com prova social e mapeamento de dor."
          : "Nutrir com conteudo e revisar timing antes de insistir no fechamento.";

    return okResult(
      {
        leadName,
        qualificationScore,
        classification,
        decisionMaker,
        budgetSignal,
        urgency,
        nextStep,
      },
      buildDisplay(`Lead ${leadName} qualificado como ${classification}.`, [
        `Score: ${qualificationScore}/100`,
        `Budget: ${budgetSignal}`,
        `Urgencia: ${urgency}`,
        `Proximo passo: ${nextStep}`,
      ]),
    );
  },
});

registerTool({
  agents: ["sdr"],
  definition: {
    name: "schedule_followup",
    description:
      "Agenda um follow-up futuro com canal, abordagem e rascunho de mensagem.",
    parameters: {
      lead_name: {
        type: "string",
        description: "Nome do lead.",
      },
      channel: {
        type: "string",
        description: "Canal do follow-up.",
        enum: ["whatsapp", "email", "telefone", "instagram"],
      },
      delay_hours: {
        type: "number",
        description: "Quantidade de horas ate o follow-up.",
      },
      approach: {
        type: "string",
        description: "Abordagem principal.",
        enum: ["consultivo", "social_proof", "urgencia", "checkin"],
      },
      message_draft: {
        type: "string",
        description: "Rascunho inicial da mensagem.",
      },
    },
    requiredParams: [
      "lead_name",
      "channel",
      "delay_hours",
      "approach",
      "message_draft",
    ],
  },
  handler: (params) => {
    const leadName = getString(params, "lead_name");
    const channel = getString(params, "channel");
    const delayHours = Math.max(1, Math.round(getNumber(params, "delay_hours")));
    const approach = getString(params, "approach");
    const messageDraft = getString(params, "message_draft");
    const scheduledFor = addHours(new Date(), delayHours);

    return okResult(
      {
        followupId: createPrefixedId("FUP"),
        leadName,
        channel,
        approach,
        delayHours,
        scheduledFor: formatDateTime(scheduledFor),
        messageDraft,
      },
      buildDisplay(`Follow-up agendado para ${leadName}.`, [
        `Canal: ${channel}`,
        `Quando: ${formatDateTime(scheduledFor)}`,
        `Abordagem: ${approach}`,
        `Rascunho: ${messageDraft}`,
      ]),
    );
  },
});

registerTool({
  agents: ["sdr"],
  definition: {
    name: "check_pipeline",
    description:
      "Retorna um snapshot mock do pipeline comercial por periodo e canal.",
    parameters: {
      period: {
        type: "string",
        description: "Janela de analise.",
        enum: ["hoje", "semana", "mes", "trimestre"],
      },
      channel_filter: {
        type: "string",
        description: "Canal especifico opcional.",
      },
    },
    requiredParams: ["period"],
  },
  handler: (params) => {
    const period = getString(params, "period");
    const channelFilter = getOptionalString(params, "channel_filter");

    const dataset = {
      hoje: { novos: 9, qualificados: 4, reunioes: 2, fechados: 1, perdidos: 1 },
      semana: { novos: 42, qualificados: 18, reunioes: 9, fechados: 5, perdidos: 6 },
      mes: { novos: 168, qualificados: 72, reunioes: 31, fechados: 17, perdidos: 24 },
      trimestre: {
        novos: 480,
        qualificados: 201,
        reunioes: 83,
        fechados: 46,
        perdidos: 61,
      },
    } as const;

    const base = dataset[period as keyof typeof dataset];
    const multiplier = channelFilter ? 0.42 : 1;
    const novos = Math.round(base.novos * multiplier);
    const qualificados = Math.round(base.qualificados * multiplier);
    const reunioes = Math.round(base.reunioes * multiplier);
    const fechados = Math.round(base.fechados * multiplier);
    const perdidos = Math.round(base.perdidos * multiplier);
    const conversao = novos > 0 ? (fechados / novos) * 100 : 0;

    return okResult(
      {
        period,
        channelFilter: channelFilter ?? null,
        novos,
        qualificados,
        reunioes,
        fechados,
        perdidos,
        conversao,
      },
      buildDisplay(`Pipeline de ${period}${channelFilter ? ` em ${channelFilter}` : ""}.`, [
        `Novos: ${novos}`,
        `Qualificados: ${qualificados}`,
        `Reunioes: ${reunioes}`,
        `Fechados: ${fechados}`,
        `Perdidos: ${perdidos}`,
        `Conversao: ${formatPercent(conversao)}`,
      ]),
    );
  },
});

registerTool({
  agents: ["sdr"],
  definition: {
    name: "log_interaction",
    description:
      "Registra uma interacao comercial com resumo e proximo passo.",
    parameters: {
      lead_name: {
        type: "string",
        description: "Nome do lead.",
      },
      interaction_type: {
        type: "string",
        description: "Tipo de interacao comercial.",
        enum: [
          "primeiro_contato",
          "follow_up",
          "reuniao",
          "negociacao",
          "objecao",
          "fechamento",
          "perdido",
        ],
      },
      summary: {
        type: "string",
        description: "Resumo objetivo da interacao.",
      },
      next_step: {
        type: "string",
        description: "Proxima acao combinada.",
      },
    },
    requiredParams: ["lead_name", "interaction_type", "summary", "next_step"],
  },
  handler: (params) => {
    const leadName = getString(params, "lead_name");
    const interactionType = getString(params, "interaction_type");
    const summary = getString(params, "summary");
    const nextStep = getString(params, "next_step");
    const loggedAt = formatDateTime(new Date());

    return okResult(
      {
        interactionId: createPrefixedId("INT"),
        leadName,
        interactionType,
        summary,
        nextStep,
        loggedAt,
        persistence: "TODO: persistir no CRM real.",
      },
      buildDisplay(`Interacao registrada para ${leadName}.`, [
        `Tipo: ${interactionType}`,
        `Resumo: ${summary}`,
        `Proximo passo: ${nextStep}`,
        `Registro: ${loggedAt}`,
      ]),
    );
  },
});

registerTool({
  agents: ["sdr"],
  definition: {
    name: "handoff_to_closer",
    description:
      "Monta um briefing consolidado para repassar um lead qualificado ao closer.",
    parameters: {
      lead_name: {
        type: "string",
        description: "Nome do lead.",
      },
      qualification_score: {
        type: "number",
        description: "Score de qualificacao atual.",
      },
      key_pain: {
        type: "string",
        description: "Dor principal identificada.",
      },
      objections: {
        type: "array",
        description: "Objecoes levantadas ate aqui.",
        items: { type: "string" },
      },
      buying_signals: {
        type: "array",
        description: "Sinais de compra observados.",
        items: { type: "string" },
      },
      recommended_approach: {
        type: "string",
        description: "Abordagem recomendada para o closer.",
      },
    },
    requiredParams: [
      "lead_name",
      "qualification_score",
      "key_pain",
      "objections",
      "buying_signals",
      "recommended_approach",
    ],
  },
  handler: (params) => {
    const leadName = getString(params, "lead_name");
    const qualificationScore = Math.round(getNumber(params, "qualification_score"));
    const keyPain = getString(params, "key_pain");
    const objections = getStringArray(params, "objections");
    const buyingSignals = getStringArray(params, "buying_signals");
    const recommendedApproach = getString(params, "recommended_approach");
    const briefing = [
      `Lead: ${leadName}`,
      `Score: ${qualificationScore}/100`,
      `Dor principal: ${keyPain}`,
      `Objecoes: ${objections.length ? objections.join(", ") : "Nenhuma mapeada"}`,
      `Sinais de compra: ${buyingSignals.length ? buyingSignals.join(", ") : "Nenhum sinal claro"}`,
      `Abordagem recomendada: ${recommendedApproach}`,
    ].join("\n");

    return okResult(
      {
        handoffId: createPrefixedId("CLOSER"),
        leadName,
        qualificationScore,
        briefing,
      },
      buildDisplay(`Briefing para closer criado para ${leadName}.`, [
        `Score: ${qualificationScore}/100`,
        `Dor principal: ${keyPain}`,
        `Abordagem: ${recommendedApproach}`,
      ]),
    );
  },
});
