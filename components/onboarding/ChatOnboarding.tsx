"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { analyzeOnboarding } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import type { OnboardingAnalysis, OnboardingMessage } from "@/types";

interface ChatOnboardingProps {
  onAnalysisChange?: (analysis: OnboardingAnalysis) => void;
}

interface GeneratedAgent {
  id: string;
  name: string;
  type: string;
  status: string;
}

const WELCOME_MESSAGE =
  "Oi! Eu sou a Frya 👋 Vou te ajudar a montar seu time de agentes em poucos minutos. Pode começar me contando: qual é o nome da sua empresa e o que vocês fazem?";

const agentTypeLabels: Record<string, string> = {
  sdr: "SDR",
  cs: "CS",
  financeiro: "Financeiro",
  marketing: "Marketing",
};

const initialMessage: OnboardingMessage = {
  id: "welcome",
  role: "assistant",
  content: WELCOME_MESSAGE,
  createdAt: new Date().toISOString(),
};

export function ChatOnboarding({ onAnalysisChange }: ChatOnboardingProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<OnboardingMessage[]>([initialMessage]);
  const [generatedAgents, setGeneratedAgents] = useState<GeneratedAgent[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [messages.length, generatedAgents.length]);

  useEffect(() => {
    if (!generatedAgents.length) {
      return;
    }

    void router.prefetch("/dashboard");

    const timeoutId = window.setTimeout(() => {
      router.push("/dashboard", { scroll: false });
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [generatedAgents, router]);

  async function sendMessage(nextMessages: OnboardingMessage[]) {
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userId: userId ?? "demo_user",
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar onboarding.");
      }

      const data = (await response.json()) as {
        message?: string;
        action?: string;
        agents?: GeneratedAgent[];
      };

      const assistantMessage: OnboardingMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          data.message?.trim() ||
          "Perfeito. Me conte um pouco mais da sua operacao para eu configurar tudo do jeito certo.",
        createdAt: new Date().toISOString(),
      };
      const updatedMessages = [...nextMessages, assistantMessage];

      setMessages(updatedMessages);
      onAnalysisChange?.(analyzeOnboarding(updatedMessages));

      if (data.action === "agents_generated" && data.agents?.length) {
        setGeneratedAgents(data.agents);
      }
    } catch {
      const fallbackMessage: OnboardingMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Nao consegui concluir essa etapa agora, mas podemos seguir. Me conta qual e hoje a maior dor operacional da empresa.",
        createdAt: new Date().toISOString(),
      };
      const updatedMessages = [...nextMessages, fallbackMessage];

      setMessages(updatedMessages);
      onAnalysisChange?.(analyzeOnboarding(updatedMessages));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();

    if (!content || generatedAgents.length) {
      return;
    }

    const userMessage: OnboardingMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setDraft("");
    onAnalysisChange?.(analyzeOnboarding(nextMessages));

    startTransition(() => {
      void sendMessage(nextMessages);
    });
  }

  return (
    <Card className="overflow-hidden border-white/12 bg-surface-strong/80">
      <CardHeader className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="accent">Frya onboarding</Badge>
            <CardTitle className="mt-4">Conversa guiada</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              A Frya conduz a conversa em portugues, entende o contexto da PME e
              monta os agentes automaticamente.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Dark flow
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className="max-h-[34rem] overflow-y-auto rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4"
        >
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "animate-message-in max-w-[90%] rounded-[1.4rem] px-4 py-3 text-sm leading-7 shadow-[0_16px_35px_rgba(0,0,0,0.18)]",
                  message.role === "assistant"
                    ? "bg-white/8 text-white"
                    : "ml-auto bg-primary text-primary-foreground",
                )}
                style={{ animationDelay: `${Math.min(index * 45, 220)}ms` }}
              >
                {message.content}
              </div>
            ))}

            {isPending ? (
              <div className="animate-message-in max-w-[12rem] rounded-[1.4rem] bg-white/8 px-4 py-3 text-sm text-white">
                Frya esta pensando...
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>
        </div>

        {generatedAgents.length ? (
          <div className="animate-panel-in rounded-[1.8rem] border border-primary/25 bg-[linear-gradient(135deg,rgba(255,129,57,0.16),rgba(18,32,48,0.82))] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <Badge variant="success">Agentes criados</Badge>
                <h3 className="mt-3 font-display text-2xl text-white">
                  Seu time de IA foi montado
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  A Frya configurou os agentes iniciais e vai te levar para o
                  dashboard em instantes.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard", { scroll: false })}
              >
                Ir agora
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {generatedAgents.map((agent, index) => (
                <div
                  key={agent.id}
                  className="animate-panel-in rounded-[1.4rem] border border-white/12 bg-black/15 p-4"
                  style={{ animationDelay: `${120 + index * 70}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-xl text-white">{agent.name}</p>
                    <Badge variant="accent">
                      {agentTypeLabels[agent.type] ?? agent.type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Status inicial: {agent.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={generatedAgents.length > 0}
            placeholder="Ex.: Somos a Clinica Aurora, atendemos por WhatsApp e Instagram e hoje a maior dor e responder rapido sem perder leads."
            className="min-h-32"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Uma resposta por vez. A Frya conduz o resto da conversa.
            </p>
            <Button type="submit" disabled={isPending || generatedAgents.length > 0}>
              {generatedAgents.length
                ? "Redirecionando..."
                : isPending
                  ? "Pensando..."
                  : "Enviar mensagem"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
