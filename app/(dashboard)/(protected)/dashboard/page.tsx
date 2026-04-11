import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { SalesLineChart } from "@/components/dashboard/SalesLineChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDashboardSummary,
  getDashboardWorkspaceByUserId,
} from "@/lib/frya-dashboard";
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/utils";

function activityVariant(type: string) {
  switch (type) {
    case "sale":
      return "success";
    case "document":
      return "accent";
    case "collection":
      return "warning";
    default:
      return "muted";
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    redirect("/onboarding");
  }

  const summary = await getDashboardSummary(workspace.tenant.id);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/10 bg-[#111111]">
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/42">
              Vendas do mes
            </p>
            <p className="font-display text-4xl text-white">
              {formatCurrency(summary.salesMonthValue)}
            </p>
            <p className="text-sm text-white/55">
              {summary.salesMonthCount} vendas registradas pela Frya
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111111]">
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/42">
              Cobrancas pendentes
            </p>
            <p className="font-display text-4xl text-white">
              {formatCurrency(summary.pendingCollectionsValue)}
            </p>
            <p className="text-sm text-white/55">
              {summary.pendingCollectionsCount} clientes aguardando retorno
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111111]">
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/42">
              Proximo agendamento
            </p>
            <p className="font-display text-3xl text-white">
              {summary.nextAppointment
                ? summary.nextAppointment.title
                : "Sem agenda"}
            </p>
            <p className="text-sm text-white/55">
              {summary.nextAppointment
                ? formatDateTime(summary.nextAppointment.scheduledAt)
                : "Quando a Frya agendar algo, ele aparece aqui."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111111]">
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/42">
              NFs armazenadas
            </p>
            <p className="font-display text-4xl text-white">
              {summary.documentsCount}
            </p>
            <p className="text-sm text-white/55">
              Documentos e comprovantes organizados no acervo
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-white/10 bg-[#111111]">
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Vendas dos ultimos 30 dias
            </p>
            <CardTitle className="mt-2">Ritmo da operacao</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.salesLast30Days.some((point) => point.value > 0) ? (
              <SalesLineChart data={summary.salesLast30Days} />
            ) : (
              <DashboardEmptyState
                ctaHref="/dashboard/vendas"
                ctaLabel="Abrir vendas"
                description="Nenhuma venda registrada ainda. Mande uma mensagem pro seu secretario!"
                title="Ainda nao existem dados suficientes para o grafico."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111111]">
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Ultimas atividades
            </p>
            <CardTitle className="mt-2">Timeline do secretario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentActivities.length ? (
              summary.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={activityVariant(activity.type)}>
                      {activity.type}
                    </Badge>
                    <span className="text-xs text-white/45">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/60">
                    {activity.description}
                  </p>
                </div>
              ))
            ) : (
              <DashboardEmptyState
                ctaHref="/dashboard/configuracoes"
                ctaLabel="Ver configuracoes"
                description="Nenhuma atividade registrada ainda. Assim que a Frya comecar a operar, tudo aparece nesta timeline."
                title="Sua timeline ainda esta vazia."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
