"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LeadStatus } from "@/types";

const leadStatuses: LeadStatus[] = [
  "novo",
  "qualificado",
  "reuniao",
  "negociacao",
  "fechado",
  "perdido",
];

function toLocalDateTimeValue(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const offset = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export function LeadEditor({
  leadId,
  initialStatus,
  initialNotes,
  initialNextStep,
  initialNextStepAt,
}: {
  leadId: string;
  initialStatus: LeadStatus;
  initialNotes: string;
  initialNextStep: string;
  initialNextStepAt: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [nextStep, setNextStep] = useState(initialNextStep);
  const [nextStepAt, setNextStepAt] = useState(
    toLocalDateTimeValue(initialNextStepAt),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function persist(patch: {
    status?: LeadStatus;
    notes?: string;
    nextStep?: string;
    nextStepAt?: string | null;
  }) {
    startTransition(async () => {
      setFeedback(null);

      try {
        const response = await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(patch),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Falha ao atualizar lead.");
        }

        setFeedback("Lead atualizado.");
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "Falha ao atualizar lead.",
        );
      }
    });
  }

  function handleSave() {
    persist({
      status,
      notes,
      nextStep,
      nextStepAt: nextStepAt ? new Date(nextStepAt).toISOString() : null,
    });
  }

  function handleScheduleFollowup() {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const value = toLocalDateTimeValue(tomorrow.toISOString());
    setNextStepAt(value);
    setNextStep(nextStep || "Realizar follow-up consultivo.");
    persist({
      status,
      notes,
      nextStep: nextStep || "Realizar follow-up consultivo.",
      nextStepAt: tomorrow.toISOString(),
    });
  }

  function handleMarkLost() {
    setStatus("perdido");
    persist({
      status: "perdido",
      notes,
      nextStep,
      nextStepAt: nextStepAt ? new Date(nextStepAt).toISOString() : null,
    });
  }

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2 text-sm text-white/72">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">
            status
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as LeadStatus)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
            disabled={isPending}
          >
            {leadStatuses.map((item) => (
              <option key={item} value={item} className="bg-[#111111]">
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-white/72">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">
            proximo passo
          </span>
          <Input
            value={nextStep}
            onChange={(event) => setNextStep(event.target.value)}
            placeholder="Ex.: enviar proposta ou fazer follow-up"
            disabled={isPending}
          />
        </label>

        <label className="space-y-2 text-sm text-white/72 lg:col-span-2">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">
            quando
          </span>
          <Input
            type="datetime-local"
            value={nextStepAt}
            onChange={(event) => setNextStepAt(event.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="space-y-2 text-sm text-white/72 lg:col-span-2">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">
            notas
          </span>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Contexto, objecoes, combinados e observacoes."
            disabled={isPending}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar alteracoes"}
        </Button>
        <Button variant="secondary" onClick={handleScheduleFollowup} disabled={isPending}>
          Agendar follow-up
        </Button>
        <Button variant="outline" onClick={handleMarkLost} disabled={isPending}>
          Marcar como perdido
        </Button>
      </div>

      {feedback ? (
        <p className="mt-3 text-sm text-white/60">{feedback}</p>
      ) : null}
    </div>
  );
}
