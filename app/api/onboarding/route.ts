import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { callClaude, type Message } from "@/lib/claude";
import { getDatabaseHealth } from "@/lib/db";
import { generateAgentsFromOnboarding } from "@/lib/agents/orchestrator";
import {
  onboardingQuizSchema,
  type OnboardingQuizFormInput,
} from "@/lib/onboarding-quiz";
import { persistOnboardingQuiz } from "@/lib/onboarding-quiz-server";

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

IMPORTANTE: Faca SEMPRE apenas UMA pergunta por vez. Nunca liste multiplas perguntas em sequencia.

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

function hasChatMessagesPayload(
  value: unknown,
): value is {
  messages?: unknown;
  userId?: string;
} {
  return value !== null && typeof value === "object" && "messages" in value;
}

function mapFieldErrors(
  issues: Array<{
    path: PropertyKey[];
    message: string;
  }>,
) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const path = issue.path.map(String).join(".");

    if (!path || fieldErrors[path]) {
      continue;
    }

    fieldErrors[path] = issue.message;
  }

  return fieldErrors;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as unknown;

    if (hasChatMessagesPayload(payload)) {
      const normalizedUserId =
        typeof payload.userId === "string" && payload.userId.trim().length > 0
          ? payload.userId
          : "demo_user";
      const normalizedMessages = toClaudeMessages(payload.messages);
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
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Nao autenticado.",
        },
        { status: 401 },
      );
    }

    const dbHealth = getDatabaseHealth();

    if (!dbHealth.configured) {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL nao configurada para salvar o onboarding.",
        },
        { status: 503 },
      );
    }

    const validation = onboardingQuizSchema.safeParse(
      payload as OnboardingQuizFormInput,
    );

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Revise os campos obrigatorios antes de continuar.",
          fieldErrors: mapFieldErrors(validation.error.issues),
        },
        { status: 400 },
      );
    }

    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress ??
      `${userId}@frya.local`;
    const name =
      user?.fullName ??
      user?.firstName ??
      user?.emailAddresses[0]?.emailAddress ??
      null;

    await persistOnboardingQuiz({
      userId,
      email,
      name,
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    console.error("ERRO ONBOARDING:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno",
      },
      { status: 500 },
    );
  }
}
