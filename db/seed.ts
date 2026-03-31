import { and, eq } from "drizzle-orm";
import {
  agents,
  companies,
  conversations,
  leads,
  users,
  type ConversationMessage,
} from "./schema";
import { db } from "../lib/db";
import { buildSystemPrompt } from "../lib/prompts/builder";
import type {
  AgentKey,
  CompanyProfile,
  LeadClassification,
  LeadSource,
  LeadStatus,
} from "../types";

const agentNames: Record<AgentKey, string> = {
  sdr: "VECTOR",
  cs: "ARIA",
  financeiro: "FLUX",
  marketing: "CIPHER",
};

const demoLeads: Array<{
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  classification: LeadClassification;
  mainPain: string;
  nextStep: string;
  notes: string;
}> = [
  {
    name: "Clinica Aurora",
    phone: "+55 11 99888-1001",
    email: "contato@clinicaaurora.com",
    source: "whatsapp",
    status: "negociacao",
    score: 89,
    classification: "hot",
    mainPain: "Perde leads fora do horario comercial.",
    nextStep: "Enviar proposta com plano de ativacao.",
    notes: "Lead quente. Pediu proposta ainda hoje.",
  },
  {
    name: "Studio Semente",
    phone: "+55 21 99777-1002",
    email: "hello@studiosemente.com",
    source: "instagram",
    status: "qualificado",
    score: 74,
    classification: "warm",
    mainPain: "Demora para responder directs e orcamentos.",
    nextStep: "Marcar reuniao de diagnostico.",
    notes: "Equipe pequena, alta demanda organica.",
  },
  {
    name: "Escritorio Lume",
    phone: "+55 31 99666-1003",
    email: "comercial@lume.com.br",
    source: "email",
    status: "reuniao",
    score: 78,
    classification: "warm",
    mainPain: "Follow-up manual em propostas juridicas.",
    nextStep: "Confirmar escopo antes da demonstracao.",
    notes: "Quer integrar comercial e financeiro.",
  },
  {
    name: "Mercado Benvinda",
    phone: "+55 41 99555-1004",
    email: "compras@benvinda.com",
    source: "site",
    status: "novo",
    score: 42,
    classification: "cold",
    mainPain: "Fluxo comercial descentralizado.",
    nextStep: "Retomar com mensagem consultiva.",
    notes: "Entrou pelo formulario sem muito contexto.",
  },
  {
    name: "Odonto Serra",
    phone: "+55 85 99444-1005",
    email: "diretoria@odontoserra.com",
    source: "whatsapp",
    status: "fechado",
    score: 94,
    classification: "hot",
    mainPain: "Equipe sobrecarregada no atendimento inicial.",
    nextStep: "Iniciar onboarding.",
    notes: "Contrato aprovado. Entrando em implantacao.",
  },
  {
    name: "Academia Atlas",
    phone: "+55 61 99333-1006",
    email: "crescimento@atlasfit.com",
    source: "instagram",
    status: "negociacao",
    score: 82,
    classification: "hot",
    mainPain: "Leads frios apos o primeiro contato.",
    nextStep: "Enviar estudo de caso e ROI.",
    notes: "Objeccao principal ainda e preco.",
  },
  {
    name: "Moveis Horizonte",
    phone: "+55 71 99222-1007",
    email: "vendas@horizonte.com",
    source: "manual",
    status: "qualificado",
    score: 71,
    classification: "warm",
    mainPain: "Pedidos chegam por varios canais e sem padrao.",
    nextStep: "Mostrar fluxo multicanal.",
    notes: "Tem equipe comercial interna.",
  },
  {
    name: "Agencia Prisma",
    phone: "+55 11 99111-1008",
    email: "ops@agenciaprisma.co",
    source: "site",
    status: "reuniao",
    score: 76,
    classification: "warm",
    mainPain: "Nao consegue responder leads de campanha rapido.",
    nextStep: "Levar roteiro de atendimento no demo.",
    notes: "Tem alto volume de trafego pago.",
  },
  {
    name: "Vitta Estetica",
    phone: "+55 51 99000-1009",
    email: "comercial@vittaestetica.com",
    source: "whatsapp",
    status: "novo",
    score: 55,
    classification: "warm",
    mainPain: "Equipe perde agendamentos por atraso no retorno.",
    nextStep: "Fazer primeiro follow-up ainda hoje.",
    notes: "Lead pediu detalhes de implantacao.",
  },
  {
    name: "Casa do Pao Sul",
    phone: "+55 47 98999-1010",
    email: "operacao@casadopaosul.com",
    source: "email",
    status: "perdido",
    score: 33,
    classification: "cold",
    mainPain: "Nao tem time dedicado para vendas.",
    nextStep: "Arquivado.",
    notes: "Disse que vai priorizar no proximo trimestre.",
  },
  {
    name: "Construtora Porto Belo",
    phone: "+55 48 98888-1011",
    email: "novosnegocios@portobelo.com",
    source: "site",
    status: "negociacao",
    score: 86,
    classification: "hot",
    mainPain: "Leads ficam sem resposta fora do horario do stand.",
    nextStep: "Validar integracao com time interno.",
    notes: "Quer piloto rapido.",
  },
  {
    name: "Pet Care Vila",
    phone: "+55 62 98777-1012",
    email: "gestao@petcarevila.com",
    source: "manual",
    status: "novo",
    score: 47,
    classification: "cold",
    mainPain: "Respostas muito manuais no WhatsApp.",
    nextStep: "Descobrir volume mensal.",
    notes: "Ainda explorando possibilidades.",
  },
  {
    name: "Escola Horizonte Azul",
    phone: "+55 63 98666-1013",
    email: "admissao@horizonteazul.edu.br",
    source: "instagram",
    status: "qualificado",
    score: 69,
    classification: "warm",
    mainPain: "Processo de captacao sem padrao.",
    nextStep: "Enviar proposta com foco em atendimento.",
    notes: "Tom mais acolhedor faz diferenca.",
  },
  {
    name: "Loja Nativo Decor",
    phone: "+55 64 98555-1014",
    email: "vendas@nativodecor.com",
    source: "whatsapp",
    status: "reuniao",
    score: 73,
    classification: "warm",
    mainPain: "Muito retrabalho entre direct e WhatsApp.",
    nextStep: "Revisar objeccoes no demo.",
    notes: "Esperando aprovacao da socia.",
  },
  {
    name: "Cozinha da Serra",
    phone: "+55 65 98444-1015",
    email: "chef@cozinhadaserra.com",
    source: "site",
    status: "novo",
    score: 38,
    classification: "cold",
    mainPain: "Nao consegue manter follow-up constante.",
    nextStep: "Fazer retomada com prova social.",
    notes: "Lead recente sem urgencia definida.",
  },
  {
    name: "Solar Engenharia",
    phone: "+55 66 98333-1016",
    email: "comercial@solareng.com.br",
    source: "email",
    status: "fechado",
    score: 91,
    classification: "hot",
    mainPain: "Leads chegam por e-mail e ficam dispersos.",
    nextStep: "Entrar em fase de ativacao.",
    notes: "Contrato assinado e kickoff alinhado.",
  },
  {
    name: "Clinica Vida Leve",
    phone: "+55 67 98222-1017",
    email: "atendimento@vidaleve.com",
    source: "instagram",
    status: "qualificado",
    score: 68,
    classification: "warm",
    mainPain: "Demora no primeiro retorno.",
    nextStep: "Agendar reuniao de mapeamento.",
    notes: "Tem interesse em CS e financeiro tambem.",
  },
  {
    name: "Auto Center Ponto",
    phone: "+55 68 98111-1018",
    email: "contato@autocenterponto.com",
    source: "manual",
    status: "perdido",
    score: 29,
    classification: "cold",
    mainPain: "Ainda sem volume para justificar investimento.",
    nextStep: "Reativar em 60 dias.",
    notes: "Pedido para retomar no futuro.",
  },
];

const demoConversations: Array<{
  agentType: AgentKey;
  leadName: string;
  messages: ConversationMessage[];
}> = [
  {
    agentType: "sdr",
    leadName: "Clinica Aurora",
    messages: [
      {
        role: "user",
        content: "A Clinica Aurora quer entender como voces aceleram o primeiro atendimento.",
        createdAt: "2026-03-27T12:00:00.000Z",
        metadata: { leadName: "Clinica Aurora", seed: "dashboard-pipeline" },
      },
      {
        role: "assistant",
        content:
          "Perfeito. Ja entendi o contexto da Clinica Aurora e consigo estruturar a qualificacao com follow-up rapido.",
        createdAt: "2026-03-27T12:02:00.000Z",
        metadata: { leadName: "Clinica Aurora", seed: "dashboard-pipeline" },
      },
      {
        role: "assistant",
        content:
          "Lead Clinica Aurora qualificado como hot. Score 89/100. Proximo passo: Agendar reuniao de diagnostico ou demonstracao nas proximas 24h.",
        createdAt: "2026-03-27T12:03:00.000Z",
        metadata: { leadName: "Clinica Aurora", seed: "dashboard-pipeline" },
      },
    ],
  },
  {
    agentType: "sdr",
    leadName: "Academia Atlas",
    messages: [
      {
        role: "user",
        content: "A Academia Atlas pediu prova social antes de avancar.",
        createdAt: "2026-03-28T09:10:00.000Z",
        metadata: { leadName: "Academia Atlas", seed: "dashboard-pipeline" },
      },
      {
        role: "assistant",
        content:
          "Follow-up agendado para Academia Atlas. Canal: whatsapp. Quando: 29/03/2026 09:00. Abordagem: social_proof.",
        createdAt: "2026-03-28T09:12:00.000Z",
        metadata: { leadName: "Academia Atlas", seed: "dashboard-pipeline" },
      },
    ],
  },
  {
    agentType: "cs",
    leadName: "Odonto Serra",
    messages: [
      {
        role: "user",
        content: "Odonto Serra reportou uma duvida de onboarding e pediu retorno rapido.",
        createdAt: "2026-03-28T14:30:00.000Z",
        metadata: { leadName: "Odonto Serra", seed: "dashboard-pipeline" },
      },
      {
        role: "assistant",
        content:
          "Ticket criado para Odonto Serra. Categoria: solicitacao. Prioridade: alta. SLA: 8h.",
        createdAt: "2026-03-28T14:33:00.000Z",
        metadata: { leadName: "Odonto Serra", seed: "dashboard-pipeline" },
      },
    ],
  },
  {
    agentType: "financeiro",
    leadName: "Solar Engenharia",
    messages: [
      {
        role: "user",
        content: "Solar Engenharia pediu confirmacao de vencimento da primeira cobranca.",
        createdAt: "2026-03-29T10:15:00.000Z",
        metadata: { leadName: "Solar Engenharia", seed: "dashboard-pipeline" },
      },
      {
        role: "assistant",
        content:
          "Cobranca gerada para Solar Engenharia. Valor: R$ 7.800,00. Vencimento: 05/04/2026.",
        createdAt: "2026-03-29T10:17:00.000Z",
        metadata: { leadName: "Solar Engenharia", seed: "dashboard-pipeline" },
      },
    ],
  },
  {
    agentType: "marketing",
    leadName: "Agencia Prisma",
    messages: [
      {
        role: "user",
        content: "A Agencia Prisma quer uma campanha focada em gerar leads pelo Instagram.",
        createdAt: "2026-03-29T16:00:00.000Z",
        metadata: { leadName: "Agencia Prisma", seed: "dashboard-pipeline" },
      },
      {
        role: "assistant",
        content:
          "Briefing de copy pronto para instagram_feed. Objetivo: gerar_leads. Publico: decisores de marketing.",
        createdAt: "2026-03-29T16:04:00.000Z",
        metadata: { leadName: "Agencia Prisma", seed: "dashboard-pipeline" },
      },
    ],
  },
  {
    agentType: "cs",
    leadName: "Clinica Vida Leve",
    messages: [
      {
        role: "user",
        content: "A Clinica Vida Leve sinalizou frustracao com a demora no retorno do time.",
        createdAt: "2026-03-30T08:20:00.000Z",
        metadata: { leadName: "Clinica Vida Leve", seed: "dashboard-pipeline" },
      },
      {
        role: "assistant",
        content:
          "Risco de churn medio para Clinica Vida Leve. Score: 58/100. Acoes: Fazer contato proativo com plano de correcao.",
        createdAt: "2026-03-30T08:24:00.000Z",
        metadata: { leadName: "Clinica Vida Leve", seed: "dashboard-pipeline" },
      },
    ],
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildCompanyContext(company: typeof companies.$inferSelect) {
  return {
    name: company.name,
    segment: company.segment ?? "Servicos",
    size: company.size ?? "6-20",
    mainPain: company.mainPain ?? "Leads sem follow-up padronizado",
    icp: company.icp ?? "PMEs brasileiras em crescimento",
    product: company.product ?? "Agentes de IA com runtime operacional",
    tone: company.tone ?? "profissional, clara e objetiva",
    language: "pt-BR" as const,
    suggestedAgents: ["sdr", "cs", "financeiro", "marketing"] as AgentKey[],
  };
}

async function pickTargetUserId() {
  if (process.env.SEED_USER_ID) {
    return process.env.SEED_USER_ID;
  }

  const existingCompany = (
    await db.select().from(companies).limit(1)
  )[0];

  if (existingCompany?.userId) {
    return existingCompany.userId;
  }

  const existingUser = (await db.select().from(users).limit(1))[0];

  if (existingUser?.id) {
    return existingUser.id;
  }

  return "demo_seed_user";
}

async function ensureUser(userId: string) {
  const existing = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: userId,
      email: `${userId}@seed.local`,
      name: "Usuario Seed Frya",
    })
    .returning();

  return created;
}

async function ensureCompany(userId: string) {
  const existing = (
    await db.select().from(companies).where(eq(companies.userId, userId)).limit(1)
  )[0];

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(companies)
    .values({
      userId,
      name: "Empresa Demo Frya",
      segment: "Servicos",
      size: "6-20",
      mainPain: "Leads se perdem entre WhatsApp, Instagram e planilhas.",
      icp: "PMEs brasileiras com operacao comercial enxuta",
      product: "Times de agentes de IA para vendas, CS e financeiro",
      tone: "profissional, clara e acolhedora",
      onboardingCompleted: true,
    })
    .returning();

  return created;
}

async function ensureAgents(
  userId: string,
  company: typeof companies.$inferSelect,
) {
  const existingAgents = await db
    .select()
    .from(agents)
    .where(and(eq(agents.userId, userId), eq(agents.companyId, company.id)));

  const context = buildCompanyContext(company);
  const agentMap = new Map(existingAgents.map((agent) => [agent.type, agent]));

  for (const agentType of ["sdr", "cs", "financeiro", "marketing"] as AgentKey[]) {
    if (agentMap.has(agentType)) {
      continue;
    }

    const [created] = await db
      .insert(agents)
      .values({
        companyId: company.id,
        userId,
        type: agentType,
        name: agentNames[agentType],
        status: "active",
        systemPrompt: buildSystemPrompt(agentType, context),
      })
      .returning();

    agentMap.set(agentType, created);
  }

  return agentMap;
}

async function seedLeads(
  userId: string,
  companyId: string,
) {
  const existingLeads = await db
    .select()
    .from(leads)
    .where(eq(leads.companyId, companyId));
  const existingNames = new Set(existingLeads.map((lead) => normalizeText(lead.name)));

  let inserted = 0;

  for (const [index, lead] of demoLeads.entries()) {
    if (existingNames.has(normalizeText(lead.name))) {
      continue;
    }

    const nextStepAt = new Date();
    nextStepAt.setDate(nextStepAt.getDate() + ((index % 4) + 1));

    const lastContactAt = new Date();
    lastContactAt.setDate(lastContactAt.getDate() - (index % 6));

    await db.insert(leads).values({
      companyId,
      userId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      classification: lead.classification,
      mainPain: lead.mainPain,
      notes: lead.notes,
      nextStep: lead.nextStep,
      nextStepAt,
      lastContactAt,
    });

    inserted += 1;
  }

  return inserted;
}

async function seedConversations(
  userId: string,
  agentMap: Map<string, typeof agents.$inferSelect>,
) {
  const existingConversations = await db
    .select({
      conversation: conversations,
      agentType: agents.type,
    })
    .from(conversations)
    .innerJoin(agents, eq(conversations.agentId, agents.id))
    .where(eq(conversations.userId, userId));

  let inserted = 0;

  for (const sample of demoConversations) {
    const agent = agentMap.get(sample.agentType);

    if (!agent) {
      continue;
    }

    const alreadyExists = existingConversations.some((record) => {
      if (record.agentType !== sample.agentType) {
        return false;
      }

      return record.conversation.messages.some(
        (message) =>
          normalizeText(
            (typeof message.metadata?.leadName === "string" &&
              message.metadata.leadName) ||
              "",
          ) === normalizeText(sample.leadName),
      );
    });

    if (alreadyExists) {
      continue;
    }

    await db.insert(conversations).values({
      agentId: agent.id,
      userId,
      messages: sample.messages,
    });

    inserted += 1;
  }

  return inserted;
}

async function main() {
  const userId = await pickTargetUserId();
  await ensureUser(userId);
  const company = await ensureCompany(userId);
  const agentMap = await ensureAgents(userId, company);
  const insertedLeads = await seedLeads(userId, company.id);
  const insertedConversations = await seedConversations(userId, agentMap);

  console.log(
    `Seed concluido para userId=${userId}. Leads inseridos: ${insertedLeads}. Conversas inseridas: ${insertedConversations}.`,
  );
}

void main()
  .catch((error) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    process.exit();
  });
