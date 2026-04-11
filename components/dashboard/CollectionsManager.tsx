"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCollectionStatus, formatCurrency, formatDate } from "@/lib/utils";

interface CollectionRow {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  dueDate: string;
  status: string;
  lastReminderSentAt: string | null;
  notes: string | null;
}

interface CollectionsManagerProps {
  rows: CollectionRow[];
}

function badgeVariant(status: string) {
  switch (status) {
    case "paid":
      return "success";
    case "overdue":
      return "danger";
    case "sent":
      return "accent";
    default:
      return "warning";
  }
}

export function CollectionsManager({ rows }: CollectionsManagerProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(id: string, action: "mark_paid" | "send_reminder") {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch("/api/collections", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Nao foi possivel atualizar a cobranca.");
      }

      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel atualizar a cobranca.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-[1.7rem] border border-white/10 bg-[#111111] p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg text-white">{row.customerName}</p>
                  <Badge variant={badgeVariant(row.status)}>
                    {formatCollectionStatus(row.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-white/56">
                  {row.customerPhone} / vence em {formatDate(row.dueDate)}
                </p>
                {row.notes ? (
                  <p className="mt-2 text-sm text-white/62">{row.notes}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <p className="text-2xl text-white">{formatCurrency(row.amount)}</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={busyId === row.id || row.status === "paid"}
                    onClick={() => runAction(row.id, "mark_paid")}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {busyId === row.id ? "Salvando..." : "Marcar como paga"}
                  </Button>
                  <Button
                    disabled={busyId === row.id}
                    onClick={() => runAction(row.id, "send_reminder")}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Reenviar lembrete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
