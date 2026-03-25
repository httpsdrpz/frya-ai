import { callClaude } from "@/lib/claude";
import {
  generateAgentReply,
  getAgentById,
  getDefaultCompanyProfile,
} from "@/lib/agents/orchestrator";
import type { AgentChatMessage, AgentKey } from "@/types";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        agentId?: AgentKey;
        message?: string;
      }
    | null;

  if (!payload?.agentId || !payload.message) {
    return Response.json(
      { error: "agentId e message sao obrigatorios." },
      { status: 400 },
    );
  }

  const company = getDefaultCompanyProfile();
  const agent = getAgentById(payload.agentId, company);

  if (!agent) {
    return Response.json({ error: "Agente nao encontrado." }, { status: 404 });
  }

  let content = generateAgentReply(payload.agentId, payload.message, company);

  try {
    content = await callClaude(
      [
        {
          role: "user",
          content: payload.message,
        },
      ],
      `Voce e ${agent.name}, um agente especializado da Frya.ai. Responda em portugues com foco no objetivo: ${agent.objective}`,
    );
  } catch {
    content = generateAgentReply(payload.agentId, payload.message, company);
  }

  const message: AgentChatMessage = {
    id: crypto.randomUUID(),
    agentId: payload.agentId,
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };

  return Response.json({ message });
}
