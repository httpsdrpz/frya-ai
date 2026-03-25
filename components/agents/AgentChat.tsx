"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { AgentChatMessage, AgentKey } from "@/types";

interface AgentChatProps {
  agentId: AgentKey;
  agentName: string;
  objective: string;
  openingMessage: string;
}

export function AgentChat({
  agentId,
  agentName,
  objective,
  openingMessage,
}: AgentChatProps) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: "opening",
      agentId,
      role: "assistant",
      content: openingMessage,
      createdAt: new Date().toISOString(),
    },
  ]);

  async function sendMessage(content: string) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          message: content,
        }),
      });

      const data = (await response.json()) as {
        message?: AgentChatMessage;
      };

      setMessages((current) => [
        ...current,
        data.message ?? {
          id: crypto.randomUUID(),
          agentId,
          role: "assistant",
          content: `Recebi sua solicitacao. Vou responder considerando o objetivo: ${objective}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          agentId,
          role: "assistant",
          content:
            "Nao consegui falar com a API agora, mas posso seguir com o playbook sugerido localmente.",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();

    if (!content) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        agentId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");

    startTransition(() => {
      void sendMessage(content);
    });
  }

  return (
    <Card className="border-white/12 bg-surface-strong/80">
      <CardHeader>
        <CardTitle>Chat com {agentName}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{objective}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-[1.5rem] border border-white/10 bg-white/4 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
                message.role === "assistant"
                  ? "bg-white/8 text-white"
                  : "ml-auto bg-primary text-primary-foreground"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Peca uma acao para o ${agentName.toLowerCase()}...`}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Respondendo..." : "Enviar mensagem"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
