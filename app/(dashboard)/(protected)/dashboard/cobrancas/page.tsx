import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CollectionsManager } from "@/components/dashboard/CollectionsManager";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCollectionsPageData,
  getDashboardWorkspaceByUserId,
  toNumber,
} from "@/lib/frya-dashboard";
import { formatCurrency } from "@/lib/utils";

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CollectionsPage({
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
  const collectionsData = await getCollectionsPageData(workspace.tenant.id, {
    period: pickValue(filters.period) ?? "30d",
    from: pickValue(filters.from),
    to: pickValue(filters.to),
    status: pickValue(filters.status) ?? "all",
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/10 bg-[#111111]">
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/42">
              Total pendente
            </p>
            <p className="font-display text-4xl text-white">
              {formatCurrency(collectionsData.pendingTotal)}
            </p>
            <p className="text-sm text-white/55">
              Valor aberto no filtro atual
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-[#111111]">
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/42">
              Recebido no mes
            </p>
            <p className="font-display text-4xl text-white">
              {formatCurrency(collectionsData.receivedThisMonth)}
            </p>
            <p className="text-sm text-white/55">
              Total marcado como pago neste mes
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/10 bg-[#111111]">
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70">
              <select
                className="h-11 w-full bg-transparent outline-none"
                defaultValue={pickValue(filters.status) ?? "all"}
                name="status"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="sent">Enviada</option>
                <option value="paid">Paga</option>
                <option value="overdue">Atrasada</option>
              </select>
            </label>
            <label className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70">
              <select
                className="h-11 w-full bg-transparent outline-none"
                defaultValue={pickValue(filters.period) ?? "30d"}
                name="period"
              >
                <option value="7d">Ultimos 7 dias</option>
                <option value="30d">Ultimos 30 dias</option>
                <option value="90d">Ultimos 90 dias</option>
                <option value="month">Mes atual</option>
                <option value="all">Tudo</option>
              </select>
            </label>
            <input
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
              defaultValue={pickValue(filters.from) ?? ""}
              name="from"
              type="date"
            />
            <div className="flex gap-3">
              <input
                className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                defaultValue={pickValue(filters.to) ?? ""}
                name="to"
                type="date"
              />
              <button
                className="rounded-full bg-[#00FF88] px-5 text-sm font-medium text-[#04110a]"
                type="submit"
              >
                Filtrar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {collectionsData.rows.length ? (
        <CollectionsManager
          rows={collectionsData.rows.map((row) => ({
            ...row,
            amount: toNumber(row.amount),
            dueDate: row.dueDate.toISOString(),
            createdAt: row.createdAt.toISOString(),
            lastReminderSentAt: row.lastReminderSentAt?.toISOString() ?? null,
          }))}
        />
      ) : (
        <DashboardEmptyState
          ctaHref="/dashboard"
          ctaLabel="Voltar ao inicio"
          description="Nenhuma cobranca registrada ainda. Quando a Frya acompanhar pendencias de pagamento, tudo aparece aqui."
          title="Nao existem cobrancas neste filtro."
        />
      )}
    </div>
  );
}
