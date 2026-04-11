import Link from "next/link";
import { addMonths, format, subMonths } from "date-fns";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AgendaBoard } from "@/components/dashboard/AgendaBoard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import {
  getAppointmentsPageData,
  getDashboardWorkspaceByUserId,
} from "@/lib/frya-dashboard";

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    redirect("/onboarding");
  }

  const filters = await searchParams;
  const agendaData = await getAppointmentsPageData(workspace.tenant.id, {
    month: pickValue(filters.month),
  });
  const selectedMonth = format(agendaData.selectedMonth, "yyyy-MM");
  const previousMonth = format(subMonths(agendaData.selectedMonth, 1), "yyyy-MM");
  const nextMonth = format(addMonths(agendaData.selectedMonth, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/58">
            A Frya organiza reunioes, entregas e follow-ups neste calendario.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
            href={`/dashboard/agenda?month=${previousMonth}`}
          >
            Mes anterior
          </Link>
          <Link
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
            href={`/dashboard/agenda?month=${nextMonth}`}
          >
            Proximo mes
          </Link>
        </div>
      </div>

      {agendaData.rows.length || agendaData.upcoming.length ? (
        <AgendaBoard
          rows={agendaData.rows.map((row) => ({
            ...row,
            scheduledAt: row.scheduledAt.toISOString(),
            reminderAt: row.reminderAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
          }))}
          selectedMonth={selectedMonth}
          upcoming={agendaData.upcoming.map((row) => ({
            ...row,
            scheduledAt: row.scheduledAt.toISOString(),
            reminderAt: row.reminderAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
          }))}
        />
      ) : (
        <DashboardEmptyState
          ctaHref="/dashboard"
          ctaLabel="Voltar ao inicio"
          description="Nenhum compromisso neste periodo. Assim que a Frya marcar algo, voce acompanha por aqui."
          title="Sua agenda ainda esta vazia."
        />
      )}
    </div>
  );
}
