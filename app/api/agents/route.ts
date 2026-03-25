import {
  createAgentTeam,
  getAgentById,
  getDefaultCompanyProfile,
} from "@/lib/agents/orchestrator";

export async function GET() {
  return Response.json(createAgentTeam(getDefaultCompanyProfile()));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { agentId?: string }
    | null;

  if (!payload?.agentId) {
    return Response.json({ error: "agentId e obrigatorio." }, { status: 400 });
  }

  const agent = getAgentById(payload.agentId, getDefaultCompanyProfile());

  if (!agent) {
    return Response.json({ error: "Agente nao encontrado." }, { status: 404 });
  }

  return Response.json({
    ...agent,
    status: agent.status === "draft" ? "configuring" : agent.status,
    message: `Fluxo de ativacao do agente ${agent.name} iniciado.`,
  });
}
