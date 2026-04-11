"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatAppointmentStatus,
  formatDate,
  formatDateTime,
  formatMonthLabel,
} from "@/lib/utils";

interface AppointmentRow {
  id: string;
  title: string;
  description: string | null;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  reminderAt: string | null;
  status: string;
  createdAt: string;
}

interface AgendaBoardProps {
  rows: AppointmentRow[];
  upcoming: AppointmentRow[];
  selectedMonth: string;
}

function statusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "accent";
  }
}

export function AgendaBoard({
  rows,
  upcoming,
  selectedMonth,
}: AgendaBoardProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    customerName: "",
    customerPhone: "",
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "09:00",
    description: "",
  });
  const monthDate = useMemo(
    () => new Date(`${selectedMonth}-01T12:00:00`),
    [selectedMonth],
  );
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    return eachDayOfInterval({
      start: startOfWeek(monthStart, { locale: ptBR }),
      end: endOfWeek(monthEnd, { locale: ptBR }),
    });
  }, [monthDate]);

  async function updateStatus(id: string, status: "completed" | "cancelled") {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Nao foi possivel atualizar o compromisso.");
      }

      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel atualizar o compromisso.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Nao foi possivel criar o compromisso.");
      }

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nao foi possivel criar o compromisso.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
                Calendario
              </p>
              <h3 className="mt-2 font-display text-3xl text-white">
                {formatMonthLabel(monthDate)}
              </h3>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.24em] text-white/40">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((label) => (
              <div key={label} className="py-2">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dayEvents = rows.filter((row) =>
                isSameDay(new Date(row.scheduledAt), day),
              );

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-28 rounded-[1.3rem] border p-3 ${
                    isSameMonth(day, monthDate)
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-white/5 bg-white/[0.01] text-white/28"
                  } ${isToday(day) ? "shadow-[inset_0_0_0_1px_rgba(0,255,136,0.28)]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{format(day, "d")}</span>
                    {dayEvents.length ? (
                      <span className="rounded-full bg-[#00FF88]/14 px-2 py-1 text-[11px] text-[#7CFFBF]">
                        {dayEvents.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-2">
                    {dayEvents.slice(0, 2).map((row) => (
                      <div
                        key={row.id}
                        className="rounded-[1rem] border border-[#00FF88]/12 bg-[#00FF88]/6 px-2 py-2 text-xs text-white"
                      >
                        <p className="truncate">{row.title}</p>
                        <p className="mt-1 text-white/55">
                          {format(new Date(row.scheduledAt), "HH:mm")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
            Novo agendamento
          </p>
          <form className="mt-5 space-y-3" onSubmit={createAppointment}>
            <Input
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Titulo do compromisso"
              value={form.title}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerName: event.target.value,
                  }))
                }
                placeholder="Nome do cliente"
                value={form.customerName}
              />
              <Input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerPhone: event.target.value,
                  }))
                }
                placeholder="WhatsApp do cliente"
                value={form.customerPhone}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scheduledDate: event.target.value,
                  }))
                }
                type="date"
                value={form.scheduledDate}
              />
              <Input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scheduledTime: event.target.value,
                  }))
                }
                type="time"
                value={form.scheduledTime}
              />
            </div>
            <Textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Descricao opcional"
              value={form.description}
            />
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <div className="flex justify-end">
              <Button
                className="bg-[#00FF88] text-[#04110a] hover:bg-[#66ffb2]"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Salvando..." : "Criar agendamento"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
            Proximos compromissos
          </p>
          <div className="mt-5 space-y-3">
            {upcoming.map((row) => (
              <div
                key={row.id}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white">{row.title}</p>
                  <Badge variant={statusVariant(row.status)}>
                    {formatAppointmentStatus(row.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {row.customerName} / {formatDateTime(row.scheduledAt)}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    disabled={busyId === row.id || row.status !== "scheduled"}
                    onClick={() => updateStatus(row.id, "completed")}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    Concluir
                  </Button>
                  <Button
                    disabled={busyId === row.id || row.status !== "scheduled"}
                    onClick={() => updateStatus(row.id, "cancelled")}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ))}
            {!upcoming.length ? (
              <p className="text-sm text-white/58">
                Nenhum compromisso futuro registrado ainda.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#00FF88]">
            Todos do mes
          </p>
          <div className="mt-5 space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white">{row.title}</p>
                  <Badge variant={statusVariant(row.status)}>
                    {formatAppointmentStatus(row.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {row.customerName} / {formatDate(row.scheduledAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
