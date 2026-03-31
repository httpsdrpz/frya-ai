import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import "@/lib/runtime/init";
import { runAgent } from "@/lib/runtime/agent";
import { getAgentById, getConversationByAgent, saveConversation } from "@/lib/queries";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const metadata = candidate.metadata;

  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    (candidate.createdAt === undefined || typeof candidate.createdAt === "string") &&
    (metadata === undefined ||
      (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)))
  );
}

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.every(isChatMessage);
}

function extractConversationLeadName(
  toolCalls: Array<{
    result: { data?: unknown };
  }>,
) {
  for (const toolCall of toolCalls) {
    const data = toolCall.result.data;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      continue;
    }

    const record = data as Record<string, unknown>;
    const leadName =
      (typeof record.leadName === "string" && record.leadName) ||
      (typeof record.clientName === "string" && record.clientName) ||
      null;

    if (leadName) {
      return leadName;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const payload = (await req.json()) as {
      agentId?: unknown;
      conversationId?: unknown;
      messages?: unknown;
    };
    const agentId = typeof payload.agentId === "string" ? payload.agentId : "";
    const conversationId =
      typeof payload.conversationId === "string" ? payload.conversationId : undefined;
    const messages = isChatMessageArray(payload.messages) ? payload.messages : null;

    if (!agentId || !messages?.length) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    // Busca agente real do banco
    const agent = await getAgentById(agentId, userId);
    if (!agent) {
      return NextResponse.json(
        { error: "Agente nao encontrado" },
        { status: 404 },
      );
    }

    const existingConversation = await getConversationByAgent(agentId);
    const result = await runAgent(
      agent.type,
      agent.systemPrompt,
      messages,
      {
        userId,
        companyId: agent.companyId,
        agentId: agent.id,
        agentType: agent.type,
        conversationId: conversationId ?? existingConversation?.id,
      },
    );

    // Salva historico
    const leadName = extractConversationLeadName(result.toolCalls);
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: result.reply,
      createdAt: new Date().toISOString(),
      ...(leadName ? { metadata: { leadName } } : {}),
    };
    const allMessages = [...messages, assistantMessage];
    const savedConversationId = await saveConversation(
      agentId,
      userId,
      allMessages,
      conversationId ?? existingConversation?.id,
    );

    return NextResponse.json({
      message: result.reply,
      conversationId: savedConversationId,
      assistantMessage,
      toolCalls: result.toolCalls.map((toolCall) => ({
        tool: toolCall.tool,
        result:
          toolCall.result.display ??
          toolCall.result.data ??
          toolCall.result.error ??
          null,
        durationMs: toolCall.durationMs,
      })),
      meta: {
        tokensUsed: result.tokensUsed,
        rounds: result.rounds,
      },
    });
  } catch (error) {
    console.error("ERRO CHAT:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
