"use client";

import { useRef, useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentChatClientProps {
  agentId: string;
  agentName: string;
  agentType: string;
  initialHistory: { role: string; content: string }[];
}

export function AgentChatClient({
  agentId,
  agentName,
  agentType,
  initialHistory,
}: AgentChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialHistory.length > 0
      ? (initialHistory as Message[])
      : [
          {
            role: "assistant",
            content: `Oi! Sou o ${agentName}, seu agente de ${agentType}. Como posso te ajudar agora?`,
          },
        ],
  );
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || isPending) return;

    const userMsg: Message = { role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setDraft("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            agentId,
            messages: nextMessages,
          }),
        });

        const data = (await res.json()) as { message?: string };
        const reply: Message = {
          role: "assistant",
          content: data.message ?? "Nao consegui processar agora. Tente novamente.",
        };

        setMessages((prev) => [...prev, reply]);
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Erro de conexao. Tente novamente." },
        ]);
      }
    });
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <Card className="border-white/12 bg-surface-strong/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Conversar com {agentName}</CardTitle>
          <Badge variant="accent">{agentType}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-white/8 text-white"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {isPending && (
            <div className="max-w-[12rem] rounded-2xl bg-white/8 px-4 py-3 text-sm text-muted-foreground">
              {agentName} esta pensando...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Fala com ${agentName}... (Enter para enviar)`}
          className="min-h-24"
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Button onClick={() => void sendMessage()} disabled={!draft.trim() || isPending}>
            {isPending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
