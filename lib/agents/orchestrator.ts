import { agents, companies, users } from "@/db/schema";
import { createCsAgent, replyAsCs } from "@/lib/agents/cs";
import {
  createFinanceiroAgent,
  replyAsFinanceiro,
} from "@/lib/agents/financeiro";
import {
  createMarketingAgent,
  replyAsMarketing,
} from "@/lib/agents/marketing";
import {
  buildSystemPrompt,
  companyContextFromOnboarding,
} from "@/lib/prompts/builder";
import { createSdrAgent, replyAsSdr } from "@/lib/agents/sdr";
import { db } from "@/lib/db";
import type {
  AgentDefinition,
  AgentKey,
  AgentTeamBundle,
  CompanyProfile,
  OnboardingAnalysis,
  OnboardingInsight,
  OnboardingMessage,
} from "@/types";

const AGENT_NAMES = {
  sdr: ["Frya", "APEX", "PULSE"],
  cs: ["ARIA", "ECHO", "NOVA"],
  financeiro: ["FLUX", "LEDGER", "VAULT"],
  marketing: ["CIPHER", "SPARK", "WAVE"],
};

interface OnboardingData {
  name: string;
  segment: string;
  size: string;
  mainPain: string;
  icp: string;
  product: string;
  tone: string;
  suggestedAgents: string[];
}

export const defaultCompanyProfile: CompanyProfile = {
  id: "cmp_demo_frya",
  businessName: "Clinica Aurora",
  industry: "Saude",
  description:
    "Clinica de diagnostico com atendimento comercial por WhatsApp e operacao enxuta.",
  teamSize: "12 pessoas",
  segment: "Clinica",
  size: "6-20",
  mainPain: "Respostas demoradas e cobranca manual",
  icp: "Pacientes particulares e empresas conveniadas",
  product: "Exames e diagnostico",
  tone: "Profissional, clara e acolhedora",
  salesChannels: ["WhatsApp", "Instagram", "Email"],
  currentTools: ["Google Sheets", "WhatsApp Business", "Conta PJ"],
  goals: [
    "Aumentar velocidade de resposta comercial",
    "Melhorar atendimento no pos-venda",
    "Reduzir atrasos de cobranca",
  ],
  painPoints: [
    "Leads sem follow-up",
    "Respostas demoradas",
    "Processos financeiros muito manuais",
  ],
  monthlyLeads: 180,
  monthlyRevenueRange: "R$ 120 mil a R$ 200 mil",
  onboardingStage: "operations",
  language: "pt-BR",
};

export const demoOnboardingMessages: OnboardingMessage[] = [
  {
    id: "msg_1",
    role: "assistant",
    content:
      "Conte um pouco sobre a sua empresa e como a operacao comercial funciona hoje.",
    createdAt: "2026-03-25T09:00:00.000Z",
  },
  {
    id: "msg_2",
    role: "user",
    content:
      "Somos a Clinica Aurora. O comercial recebe a maior parte dos contatos por WhatsApp e Instagram, mas muita coisa fica sem follow-up.",
    createdAt: "2026-03-25T09:00:25.000Z",
  },
  {
    id: "msg_3",
    role: "assistant",
    content:
      "Quantas pessoas participam da operacao e quais gargalos mais pesam no dia a dia?",
    createdAt: "2026-03-25T09:00:40.000Z",
  },
  {
    id: "msg_4",
    role: "user",
    content:
      "Temos 12 pessoas no total. Sofremos com demora no atendimento, cobranca manual e falta de padrao nas respostas.",
    createdAt: "2026-03-25T09:01:05.000Z",
  },
];

const onboardingQuestions = [
  {
    key: "industry",
    question: "Qual e o segmento principal da empresa e o perfil do cliente ideal?",
  },
  {
    key: "salesChannels",
    question:
      "Quais canais geram mais demanda hoje: WhatsApp, Instagram, email ou outro?",
  },
  {
    key: "goals",
    question:
      "Qual resultado precisa melhorar primeiro: vendas, atendimento, financeiro ou marketing?",
  },
  {
    key: "currentTools",
    question: "Que ferramentas ja fazem parte da operacao hoje?",
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function cloneProfile(profile: CompanyProfile): CompanyProfile {
  return {
    ...profile,
    salesChannels: [...profile.salesChannels],
    currentTools: [...profile.currentTools],
    goals: [...profile.goals],
    painPoints: [...profile.painPoints],
  };
}

function inferIndustry(content: string) {
  if (content.includes("clinica") || content.includes("saude")) return "Saude";
  if (content.includes("escritorio") || content.includes("consultoria")) {
    return "Servicos profissionais";
  }
  if (content.includes("loja") || content.includes("e-commerce")) return "Comercio";
  if (content.includes("educacao") || content.includes("curso")) return "Educacao";
  if (content.includes("agencia")) return "Agencia";
  return defaultCompanyProfile.industry;
}

function inferTeamSize(content: string) {
  const match = content.match(
    /(\d+)\s*(pessoas|colaboradores|funcionarios|atendentes|vendedores)/i,
  );
  return match ? `${match[1]} pessoas` : defaultCompanyProfile.teamSize;
}

function inferMonthlyLeads(content: string) {
  const match = content.match(/(\d+)\s*(leads|contatos|oportunidades)/i);
  return match ? Number(match[1]) : defaultCompanyProfile.monthlyLeads;
}

function inferChannels(content: string) {
  const channels: string[] = [];
  if (content.includes("whatsapp")) channels.push("WhatsApp");
  if (content.includes("instagram")) channels.push("Instagram");
  if (content.includes("email")) channels.push("Email");
  if (content.includes("telefone")) channels.push("Telefone");
  if (content.includes("site")) channels.push("Site");
  if (content.includes("linkedin")) channels.push("LinkedIn");

  return channels.length ? unique(channels) : [...defaultCompanyProfile.salesChannels];
}

function inferTools(content: string) {
  const tools: string[] = [];
  if (content.includes("google sheets") || content.includes("planilha")) {
    tools.push("Google Sheets");
  }
  if (content.includes("hubspot")) tools.push("HubSpot");
  if (content.includes("pipedrive")) tools.push("Pipedrive");
  if (content.includes("rd station")) tools.push("RD Station");
  if (content.includes("omie")) tools.push("Omie");
  if (content.includes("bling")) tools.push("Bling");
  if (content.includes("notion")) tools.push("Notion");
  if (content.includes("slack")) tools.push("Slack");

  return tools.length ? unique(tools) : [...defaultCompanyProfile.currentTools];
}

function inferPainPoints(content: string) {
  const painPoints: string[] = [];

  if (content.includes("demora") || content.includes("lento")) {
    painPoints.push("Respostas demoradas");
  }
  if (content.includes("follow-up") || content.includes("sem retorno")) {
    painPoints.push("Leads sem follow-up");
  }
  if (content.includes("manual")) painPoints.push("Processos muito manuais");
  if (content.includes("cobranca") || content.includes("inadimpl")) {
    painPoints.push("Cobranca sem automacao");
  }
  if (content.includes("padrao") || content.includes("desorgan")) {
    painPoints.push("Baixa padronizacao operacional");
  }
  if (
    content.includes("marketing") ||
    content.includes("conteudo") ||
    content.includes("campanha")
  ) {
    painPoints.push("Marketing sem consistencia");
  }

  return painPoints.length ? unique(painPoints) : [...defaultCompanyProfile.painPoints];
}

function inferGoals(content: string) {
  const goals: string[] = [];

  if (
    content.includes("lead") ||
    content.includes("venda") ||
    content.includes("pipeline")
  ) {
    goals.push("Aumentar volume e conversao comercial");
  }
  if (
    content.includes("atendimento") ||
    content.includes("suporte") ||
    content.includes("cliente")
  ) {
    goals.push("Melhorar atendimento no pos-venda");
  }
  if (
    content.includes("cobranca") ||
    content.includes("financeiro") ||
    content.includes("inadimpl")
  ) {
    goals.push("Reduzir atrasos de cobranca");
  }
  if (
    content.includes("marketing") ||
    content.includes("conteudo") ||
    content.includes("campanha") ||
    content.includes("trafego")
  ) {
    goals.push("Gerar mais demanda com marketing consistente");
  }
  if (content.includes("automat")) {
    goals.push("Automatizar operacao sem perder contexto");
  }

  return goals.length ? unique(goals) : [...defaultCompanyProfile.goals];
}

function inferRevenueRange(content: string) {
  if (content.includes("50 mil")) return "Ate R$ 50 mil";
  if (content.includes("100 mil")) return "R$ 50 mil a R$ 120 mil";
  if (content.includes("200 mil")) return "R$ 120 mil a R$ 200 mil";
  return defaultCompanyProfile.monthlyRevenueRange;
}

function buildProfile(messages: OnboardingMessage[]) {
  const userContent = messages
    .filter((message) => message.role === "user")
    .map((message) => normalize(message.content))
    .join(" ");

  return {
    ...cloneProfile(defaultCompanyProfile),
    industry: inferIndustry(userContent),
    description: `Empresa com foco em ${inferIndustry(userContent).toLowerCase()} e operacao em fase de estruturacao.`,
    teamSize: inferTeamSize(userContent),
    monthlyLeads: inferMonthlyLeads(userContent),
    monthlyRevenueRange: inferRevenueRange(userContent),
    segment: inferIndustry(userContent),
    size: inferTeamSize(userContent),
    mainPain: inferPainPoints(userContent)[0] ?? defaultCompanyProfile.mainPain,
    salesChannels: inferChannels(userContent),
    currentTools: inferTools(userContent),
    painPoints: inferPainPoints(userContent),
    goals: inferGoals(userContent),
    onboardingStage:
      messages.length >= 6
        ? "activation"
        : messages.length >= 4
          ? "operations"
          : "discovery",
  } satisfies CompanyProfile;
}

function buildInsights(profile: CompanyProfile): OnboardingInsight[] {
  return [
    {
      key: "industry",
      label: "Segmento",
      value: profile.industry,
      completed: Boolean(profile.industry),
    },
    {
      key: "salesChannels",
      label: "Canais principais",
      value: profile.salesChannels.join(", "),
      completed: profile.salesChannels.length > 0,
    },
    {
      key: "goals",
      label: "Objetivos",
      value: profile.goals.join(", "),
      completed: profile.goals.length > 0,
    },
    {
      key: "currentTools",
      label: "Ferramentas atuais",
      value: profile.currentTools.join(", "),
      completed: profile.currentTools.length > 0,
    },
  ];
}

function getCompletion(insights: OnboardingInsight[]) {
  const completed = insights.filter((item) => item.completed).length;
  return Math.round((completed / insights.length) * 100);
}

function buildNextQuestion(insights: OnboardingInsight[]) {
  const missing = insights.find((item) => !item.completed);
  const mapped = onboardingQuestions.find((question) => question.key === missing?.key);

  return (
    mapped?.question ??
    "Perfeito. Agora me diga qual area voce quer colocar em operacao primeiro para eu ativar os agentes certos."
  );
}

function createAgentCatalog(company: CompanyProfile): Record<AgentKey, AgentDefinition> {
  return {
    sdr: createSdrAgent(company),
    cs: createCsAgent(company),
    financeiro: createFinanceiroAgent(company),
    marketing: createMarketingAgent(company),
  };
}

function normalizeAgentKeys(agentIds: AgentKey[] | undefined) {
  if (!agentIds?.length) {
    return [] as AgentKey[];
  }

  return unique(
    agentIds.filter((agentId): agentId is AgentKey =>
      ["sdr", "cs", "financeiro", "marketing"].includes(agentId),
    ),
  );
}

function isAgentKey(agentType: string): agentType is AgentKey {
  return ["sdr", "cs", "financeiro", "marketing"].includes(agentType);
}

export function suggestAgents(profile: CompanyProfile): AgentKey[] {
  const agents: AgentKey[] = [];
  const goals = profile.goals.join(" ").toLowerCase();
  const pains = profile.painPoints.join(" ").toLowerCase();

  if (/lead|venda|pipeline/.test(goals) || profile.salesChannels.length) {
    agents.push("sdr");
  }
  if (
    /atendimento|pos-venda|cliente/.test(goals) ||
    /resposta|suporte/.test(pains)
  ) {
    agents.push("cs");
  }
  if (/cobranca|financeiro|inadimplencia/.test(goals) || /cobranca/.test(pains)) {
    agents.push("financeiro");
  }
  if (
    /marketing|conteudo|demanda|campanha/.test(goals) ||
    /marketing|conteudo|campanha/.test(pains)
  ) {
    agents.push("marketing");
  }

  return agents.length
    ? (unique(agents) as AgentKey[])
    : ["sdr", "cs", "financeiro"];
}

export function analyzeOnboarding(
  messages: OnboardingMessage[] = demoOnboardingMessages,
): OnboardingAnalysis {
  const profile = buildProfile(messages);
  const insights = buildInsights(profile);

  return {
    summary: `${profile.businessName} atua em ${profile.industry} com ${profile.teamSize}, atende principalmente por ${profile.salesChannels.join(", ")} e quer melhorar a operacao com mais padrao e automacao.`,
    nextQuestion: buildNextQuestion(insights),
    completion: getCompletion(insights),
    suggestedAgents: suggestAgents(profile),
    insights,
    companyProfile: profile,
  };
}

export function createAgentTeam(
  company: CompanyProfile = defaultCompanyProfile,
  selectedAgents?: AgentKey[],
): AgentTeamBundle {
  const profile = cloneProfile(company);
  const catalog = createAgentCatalog(profile);
  const agentIds = normalizeAgentKeys(selectedAgents).length
    ? normalizeAgentKeys(selectedAgents)
    : suggestAgents(profile);

  return {
    company: profile,
    agents: agentIds.map((agentId) => catalog[agentId]),
  };
}

export async function generateAgentsFromOnboarding(
  data: OnboardingData,
  userId: string,
) {
  await db
    .insert(users)
    .values({ id: userId, email: "" })
    .onConflictDoNothing();

  const [company] = await db
    .insert(companies)
    .values({
      userId,
      name: data.name,
      segment: data.segment,
      size: data.size,
      mainPain: data.mainPain,
      icp: data.icp,
      product: data.product,
      tone: data.tone,
      onboardingCompleted: true,
    })
    .returning();

  const createdAgents = [];
  const validAgentTypes = data.suggestedAgents.filter(isAgentKey);
  const companyContext = companyContextFromOnboarding(data);

  for (const agentType of validAgentTypes) {
    const systemPrompt = buildSystemPrompt(agentType, companyContext);
    const names = AGENT_NAMES[agentType as keyof typeof AGENT_NAMES] || ["AGENT"];
    const agentName = names[0];

    const [agent] = await db
      .insert(agents)
      .values({
        companyId: company.id,
        userId,
        type: agentType,
        name: agentName,
        status: "active",
        systemPrompt,
        config: { onboardingData: data },
      })
      .returning();

    createdAgents.push(agent);
  }

  return createdAgents;
}

export function getDefaultCompanyProfile() {
  return cloneProfile(defaultCompanyProfile);
}

export function getAgentById(
  agentId: string,
  company: CompanyProfile = defaultCompanyProfile,
) {
  const catalog = createAgentCatalog(company);

  if (agentId in catalog) {
    return catalog[agentId as AgentKey];
  }

  return null;
}

export function getAgentOpeningMessage(
  agent: AgentDefinition,
  company: CompanyProfile,
) {
  return `Sou o ${agent.name}. Meu foco e ${agent.objective.toLowerCase()} Me diga qual frente voce quer atacar primeiro na ${company.businessName}.`;
}

export function generateAgentReply(
  agentId: AgentKey,
  message: string,
  company: CompanyProfile = defaultCompanyProfile,
) {
  if (agentId === "sdr") return replyAsSdr(message, company);
  if (agentId === "cs") return replyAsCs(message, company);
  if (agentId === "financeiro") return replyAsFinanceiro(message, company);
  return replyAsMarketing(message, company);
}
