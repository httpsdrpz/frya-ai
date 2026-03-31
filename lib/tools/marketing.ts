import { registerTool } from "@/lib/runtime/tools";
import {
  buildDisplay,
  createPrefixedId,
  formatCurrency,
  formatPercent,
  getNumber,
  getOptionalNumber,
  getOptionalString,
  getString,
  getStringArray,
  okResult,
} from "@/lib/tools/utils";

const channelLimits = {
  instagram_feed: "Legenda objetiva com gancho forte e CTA final.",
  instagram_stories: "Blocos curtos, diretos e com senso de sequencia.",
  whatsapp: "Mensagem curta, personalizada e com CTA claro.",
  email: "Assunto forte, corpo escaneavel e CTA unico.",
  meta_ads: "Texto curto, beneficio central e promessa especifica.",
  google_ads: "Foco em intencao, clareza e beneficio imediato.",
  linkedin: "Tom mais consultivo, credibilidade e contexto de negocio.",
} as const;

registerTool({
  agents: ["marketing"],
  definition: {
    name: "generate_copy",
    description:
      "Monta um briefing de copy com objetivo, publico e restricoes do canal.",
    parameters: {
      objective: {
        type: "string",
        description: "Objetivo principal da copy.",
        enum: [
          "gerar_leads",
          "vender",
          "engajar",
          "educar",
          "reconhecimento",
          "reativar",
        ],
      },
      channel: {
        type: "string",
        description: "Canal de distribuicao.",
        enum: [
          "instagram_feed",
          "instagram_stories",
          "whatsapp",
          "email",
          "meta_ads",
          "google_ads",
          "linkedin",
        ],
      },
      product_or_service: {
        type: "string",
        description: "Oferta em foco.",
      },
      target_audience: {
        type: "string",
        description: "Publico-alvo principal.",
      },
      tone: {
        type: "string",
        description: "Tom desejado opcional.",
      },
      key_benefit: {
        type: "string",
        description: "Beneficio principal opcional.",
      },
    },
    requiredParams: ["objective", "channel", "product_or_service", "target_audience"],
  },
  handler: (params) => {
    const objective = getString(params, "objective");
    const channel = getString(
      params,
      "channel",
    ) as keyof typeof channelLimits;
    const productOrService = getString(params, "product_or_service");
    const targetAudience = getString(params, "target_audience");
    const tone = getOptionalString(params, "tone") ?? "claro e convincente";
    const keyBenefit =
      getOptionalString(params, "key_benefit") ?? "mostrar resultado pratico rapido";

    return okResult(
      {
        briefId: createPrefixedId("COPY"),
        objective,
        channel,
        productOrService,
        targetAudience,
        tone,
        keyBenefit,
        channelLimit: channelLimits[channel],
        instructions: [
          "Abrir com um gancho forte e relevante para o publico.",
          `Destacar o beneficio principal: ${keyBenefit}.`,
          `Respeitar a restricao do canal: ${channelLimits[channel]}`,
          "Fechar com um CTA unico e especifico.",
        ],
      },
      buildDisplay(`Briefing de copy pronto para ${channel}.`, [
        `Objetivo: ${objective}`,
        `Publico: ${targetAudience}`,
        `Tom: ${tone}`,
        `Limite do canal: ${channelLimits[channel]}`,
      ]),
    );
  },
});

registerTool({
  agents: ["marketing"],
  definition: {
    name: "plan_campaign",
    description:
      "Cria um esqueleto de campanha com fases e KPIs por objetivo.",
    parameters: {
      campaign_name: {
        type: "string",
        description: "Nome da campanha.",
      },
      objective: {
        type: "string",
        description: "Objetivo principal.",
        enum: [
          "lancamento",
          "promocao",
          "reativacao",
          "branding",
          "geracao_leads",
          "evento",
        ],
      },
      duration_days: {
        type: "number",
        description: "Duracao total em dias.",
      },
      channels: {
        type: "array",
        description: "Canais da campanha.",
        items: { type: "string" },
      },
      budget: {
        type: "number",
        description: "Orcamento opcional.",
      },
      target_audience: {
        type: "string",
        description: "Publico prioritario.",
      },
    },
    requiredParams: [
      "campaign_name",
      "objective",
      "duration_days",
      "channels",
      "target_audience",
    ],
  },
  handler: (params) => {
    const campaignName = getString(params, "campaign_name");
    const objective = getString(params, "objective");
    const durationDays = Math.max(1, Math.round(getNumber(params, "duration_days")));
    const channels = getStringArray(params, "channels");
    const budget = getOptionalNumber(params, "budget");
    const targetAudience = getString(params, "target_audience");

    const kpisByObjective = {
      lancamento: ["alcance", "leads", "taxa de clique"],
      promocao: ["receita", "ROAS", "conversao"],
      reativacao: ["reativados", "resposta", "custo por retorno"],
      branding: ["alcance qualificado", "engajamento", "lembranca"],
      geracao_leads: ["leads", "CPL", "taxa de qualificacao"],
      evento: ["inscricoes", "comparecimento", "custo por inscricao"],
    } as const;

    return okResult(
      {
        campaignId: createPrefixedId("CMP"),
        campaignName,
        objective,
        durationDays,
        channels,
        budget: budget ?? null,
        targetAudience,
        phases: [
          "Preparacao da oferta e mensagem",
          "Distribuicao e captura",
          "Acompanhamento e otimizacao",
          "Fechamento com analise final",
        ],
        kpis: kpisByObjective[objective as keyof typeof kpisByObjective],
      },
      buildDisplay(`Plano de campanha criado para ${campaignName}.`, [
        `Objetivo: ${objective}`,
        `Duracao: ${durationDays} dias`,
        `Canais: ${channels.join(", ")}`,
        `Orcamento: ${budget !== undefined ? formatCurrency(budget) : "nao informado"}`,
      ]),
    );
  },
});

registerTool({
  agents: ["marketing"],
  definition: {
    name: "content_calendar",
    description:
      "Monta uma estrutura de calendario editorial por periodo, canais e temas.",
    parameters: {
      period: {
        type: "string",
        description: "Periodo de planejamento.",
        enum: ["semana", "quinzena", "mes"],
      },
      focus_themes: {
        type: "array",
        description: "Temas prioritarios.",
        items: { type: "string" },
      },
      channels: {
        type: "array",
        description: "Canais de distribuicao.",
        items: { type: "string" },
      },
      posts_per_week: {
        type: "number",
        description: "Quantidade de posts por semana.",
      },
    },
    requiredParams: ["period", "focus_themes", "channels", "posts_per_week"],
  },
  handler: (params) => {
    const period = getString(params, "period");
    const focusThemes = getStringArray(params, "focus_themes");
    const channels = getStringArray(params, "channels");
    const postsPerWeek = Math.max(1, Math.round(getNumber(params, "posts_per_week")));

    const weeks = period === "semana" ? 1 : period === "quinzena" ? 2 : 4;
    const calendar = Array.from({ length: weeks }, (_, weekIndex) => ({
      week: weekIndex + 1,
      theme: focusThemes[weekIndex % focusThemes.length],
      suggestedChannels: channels,
      deliverables: postsPerWeek,
    }));

    return okResult(
      {
        calendarId: createPrefixedId("CAL"),
        period,
        postsPerWeek,
        calendar,
      },
      buildDisplay(`Calendario de conteudo criado para ${period}.`, [
        `Temas: ${focusThemes.join(", ")}`,
        `Canais: ${channels.join(", ")}`,
        `Posts por semana: ${postsPerWeek}`,
      ]),
    );
  },
});

registerTool({
  agents: ["marketing"],
  definition: {
    name: "analyze_performance",
    description:
      "Retorna metricas mock de marketing e recomendacoes de ajuste.",
    parameters: {
      period: {
        type: "string",
        description: "Periodo de analise.",
        enum: ["semana", "mes", "trimestre"],
      },
      channel: {
        type: "string",
        description: "Canal opcional da analise.",
      },
    },
    requiredParams: ["period"],
  },
  handler: (params) => {
    const period = getString(params, "period");
    const channel = getOptionalString(params, "channel") ?? "multicanal";

    const metrics = {
      impressoes: 84500,
      cliques: 4120,
      leads: 186,
      ctr: 4.9,
      conversao: 4.5,
    };

    const recommendations = [
      "Reforcar criativos com prova social.",
      "Separar campanhas por dor principal.",
      "Aumentar investimento apenas nos grupos com melhor CTR e conversao.",
    ];

    return okResult(
      {
        period,
        channel,
        metrics,
        recommendations,
      },
      buildDisplay(`Analise de performance em ${period} para ${channel}.`, [
        `Impressoes: ${metrics.impressoes}`,
        `Cliques: ${metrics.cliques}`,
        `Leads: ${metrics.leads}`,
        `CTR: ${formatPercent(metrics.ctr)}`,
        `Conversao: ${formatPercent(metrics.conversao)}`,
      ]),
    );
  },
});
