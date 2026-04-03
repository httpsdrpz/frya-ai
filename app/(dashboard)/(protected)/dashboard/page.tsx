import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCompanyByUserId,
  getLeadStats,
  getRecentConversations,
  hasCompletedOnboarding,
} from "@/lib/queries";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

function formatMetricPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const onboarded = await hasCompletedOnboarding(userId);

  if (!onboarded) {
    redirect("/onboarding");
  }

  const company = await getCompanyByUserId(userId);

  if (!company) {
    redirect("/onboarding");
  }

  const [stats, recentConversations] = await Promise.all([
    getLeadStats(company.id),
    getRecentConversations(userId, 5),
  ]);

  const metricCards = [
    {
      label: "Leads novos",
      value: String(stats.newThisWeek),
      hint: "Entraram nesta semana",
    },
    {
      label: "Qualificados",
      value: String(stats.qualifiedLeads),
      hint: "Prontos para avancar",
    },
    {
      label: "Taxa de conversao",
      value: formatMetricPercent(stats.conversionRate),
      hint: "Fechados sobre total",
    },
    {
      label: "Follow-ups pendentes",
      value: String(stats.followUpsPending),
      hint: "Pedem proxima acao",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.label} className="border-white/10 bg-[#111111]">
            <CardContent className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">
                {card.label}
              </p>
              <p className="font-display text-4xl text-white">{card.value}</p>
              <p className="text-sm text-white/55">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-white/10 bg-[#111111]">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  conversas recentes
                </p>
                <CardTitle className="mt-2">Ultimas 5 conversas</CardTitle>
              </div>
              <Link href="/conversations" className="text-sm text-[#22c55e]">
                Ver tudo
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentConversations.length ? (
              recentConversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="block rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#22c55e]/30 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {conversation.leadName ?? "Lead nao vinculado"}
                      </p>
                      <p className="mt-1 text-sm text-white/52">
                        {conversation.agentName} / {conversation.agentType}
                      </p>
                    </div>
                    <Badge variant="muted">
                      {formatRelativeTime(conversation.lastMessageAt)}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/65">
                    {conversation.preview}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/55">
                Ainda nao existem conversas registradas para este workspace.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-[#111111]">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                pipeline
              </p>
              <CardTitle className="mt-2">Snapshot da operacao</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                ["Novo", stats.statusCounts.novo],
                ["Qualificado", stats.statusCounts.qualificado],
                ["Reuniao", stats.statusCounts.reuniao],
                ["Negociacao", stats.statusCounts.negociacao],
                ["Fechado", stats.statusCounts.fechado],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-sm text-white/64">{label}</span>
                  <span className="text-lg text-white">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#111111]">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                empresa
              </p>
              <CardTitle className="mt-2">{company.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-white/62">
              <p>
                Segmento: <span className="text-white">{company.segment ?? "-"}</span>
              </p>
              <p>
                Porte: <span className="text-white">{company.size ?? "-"}</span>
              </p>
              <p>
                Principal dor:{" "}
                <span className="text-white">{company.mainPain ?? "-"}</span>
              </p>
              <p>
                Atualizado em{" "}
                <span className="text-white">{formatDateTime(company.createdAt)}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
