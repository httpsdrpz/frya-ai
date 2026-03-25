import { NextRequest, NextResponse } from "next/server";
import { callClaude, type Message } from "@/lib/claude";
import { generateAgentsFromOnboarding } from "@/lib/agents/orchestrator";

const ONBOARDING_SYSTEM_PROMPT = `Voce e a Frya, uma IA que ajuda empresarios brasileiros a montar seu time de agentes de IA.

Seu objetivo e conduzir uma conversa natural em portugues para entender a operacao do cliente e configurar os agentes certos para ele.

FLUXO DO ONBOARDING:
1. Boas-vindas calorosas - pergunte o nome e o que a empresa faz
2. Entenda o segmento e tamanho (MEI, pequena, media)
3. Identifique a maior dor operacional (vendas, atendimento, financeiro, marketing)
4. Entenda o cliente ideal deles (quem compra, como compra)
5. Capture o tom de voz da empresa (formal, casual, tecnico)
6. Com base nisso, anuncie quais agentes voce vai criar e por que

REGRAS:
- Faca UMA pergunta por vez, nunca duas
- Seja calorosa, direta, sem jargao tecnico
- Quando tiver dados suficientes (apos 6-8 trocas), retorne JSON no formato:
  {"action": "generate_agents", "data": {"name": "", "segment": "", "size": "", "mainPain": "", "icp": "", "product": "", "tone": "", "suggestedAgents": ["sdr"|"cs"|"financeiro"|"marketing"]}}
- Antes de gerar, confirme com o usuario: "Posso criar esses agentes pra voce?"

Tom: amigavel, brasileira, confiante. Voce e a melhor funcionaria que eles ja tiveram.`;

function toClaudeMessages(input: unknown): Message[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "role" in item &&
      "content" in item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    ) {
      return [
        {
          role: item.role,
          content: item.content,
        },
      ];
    }

    return [];
  });
}

function extractActionPayload(response: string) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*"action"[\s\S]*\}/);

    if (!jsonMatch) {
      return null;
    }

    return JSON.parse(jsonMatch[0]) as {
      action?: string;
      data?: {
        name?: string;
        segment?: string;
        size?: string;
        mainPain?: string;
        icp?: string;
        product?: string;
        tone?: string;
        suggestedAgents?: string[];
      };
    };
  } catch {
    return null;
  }
}

function stripActionJson(response: string) {
  return response.replace(/\{[\s\S]*"action"[\s\S]*\}/, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = (await req.json()) as {
      messages?: unknown;
      userId?: string;
    };
    const normalizedUserId =
      typeof userId === "string" && userId.trim().length > 0
        ? userId
        : "demo_user";

    const normalizedMessages = toClaudeMessages(messages);
    const response = await callClaude(
      normalizedMessages,
      ONBOARDING_SYSTEM_PROMPT,
      800,
    );

    const action = extractActionPayload(response);

    if (action?.action === "generate_agents" && action.data) {
      const agents = await generateAgentsFromOnboarding(
        {
          name: action.data.name ?? "",
          segment: action.data.segment ?? "",
          size: action.data.size ?? "",
          mainPain: action.data.mainPain ?? "",
          icp: action.data.icp ?? "",
          product: action.data.product ?? "",
          tone: action.data.tone ?? "",
          suggestedAgents: (action.data.suggestedAgents ?? []).filter(
            (value): value is "sdr" | "cs" | "financeiro" | "marketing" =>
              ["sdr", "cs", "financeiro", "marketing"].includes(value),
          ),
        },
        normalizedUserId,
      );

      return NextResponse.json({
        message: stripActionJson(response),
        action: "agents_generated",
        agents,
      });
    }
    return NextResponse.json({
      message:
        stripActionJson(response) ||
        response ||
        "Perfeito. Me conta um pouco mais sobre a sua operacao para eu configurar os agentes certos.",
    });
  } catch (error) {
    console.error("ERRO ONBOARDING:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
