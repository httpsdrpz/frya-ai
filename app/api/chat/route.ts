import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callClaude, type Message } from "@/lib/claude";
import { getAgentById, saveConversation } from "@/lib/queries";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { agentId, messages } = (await req.json()) as {
      agentId: string;
      messages: Message[];
    };

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

    // Chama Claude com o system prompt customizado do agente
    const reply = await callClaude(messages, agent.systemPrompt, 1000);

    // Salva historico
    const allMessages = [...messages, { role: "assistant", content: reply }];
    await saveConversation(agentId, userId, allMessages);

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("ERRO CHAT:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
