"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LeadSource } from "@/types";

const leadSources: LeadSource[] = [
  "manual",
  "whatsapp",
  "instagram",
  "email",
  "site",
];

export function LeadCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<LeadSource>("manual");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!name.trim() || isPending) {
      return;
    }

    startTransition(async () => {
      setFeedback(null);

      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            source,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Falha ao criar lead.");
        }

        setName("");
        setPhone("");
        setEmail("");
        setSource("manual");
        setFeedback("Lead criado com sucesso.");
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "Falha ao criar lead.",
        );
      }
    });
  }

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            novo lead
          </p>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do lead ou empresa"
            className="mt-3"
            disabled={isPending}
          />
        </div>

        <div className="flex-1">
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Telefone"
            disabled={isPending}
          />
        </div>

        <div className="flex-1">
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            disabled={isPending}
          />
        </div>

        <label className="flex min-w-[150px] flex-col gap-2 text-sm text-white/70">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">
            origem
          </span>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as LeadSource)}
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
            disabled={isPending}
          >
            {leadSources.map((item) => (
              <option key={item} value={item} className="bg-[#111111]">
                {item}
              </option>
            ))}
          </select>
        </label>

        <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
          {isPending ? "Criando..." : "Criar lead"}
        </Button>
      </div>

      {feedback ? (
        <p className="mt-3 text-sm text-white/60">{feedback}</p>
      ) : null}
    </div>
  );
}
