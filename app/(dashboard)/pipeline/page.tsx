import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LeadClassificationBadge, LeadStatusBadge } from "@/components/dashboard/LeadBadges";
import { LeadCreateForm } from "@/components/dashboard/LeadCreateForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCompanyByUserId,
  getLeadsByCompany,
  hasCompletedOnboarding,
} from "@/lib/queries";
import {
  formatLeadSource,
  formatRelativeTime,
} from "@/lib/utils";
import type { LeadStatus } from "@/types";

const visibleStatuses: LeadStatus[] = [
  "novo",
  "qualificado",
  "reuniao",
  "negociacao",
  "fechado",
];

export default async function PipelinePage() {
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

  const leads = await getLeadsByCompany(company.id);
  const groups = Object.fromEntries(
    visibleStatuses.map((status) => [
      status,
      leads.filter((lead) => lead.status === status),
    ]),
  ) as Record<LeadStatus, typeof leads>;
  const lostLeads = leads.filter((lead) => lead.status === "perdido");

  return (
    <div className="space-y-6">
      <LeadCreateForm />

      <section className="grid gap-4 xl:grid-cols-5">
        {visibleStatuses.map((status) => (
          <Card key={status} className="border-white/10 bg-[#111111]">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">{status}</CardTitle>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/62">
                  {groups[status].length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {groups[status].length ? (
                groups[status].map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/pipeline/${lead.id}`}
                    className="block rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#22c55e]/28 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{lead.name}</p>
                        <p className="mt-1 text-sm text-white/50">
                          {formatLeadSource(lead.source ?? "manual")}
                        </p>
                      </div>
                      <LeadClassificationBadge
                        classification={lead.classification ?? "unscored"}
                      />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-white/58">
                      <span>Score {lead.score ?? 0}</span>
                      <span>
                        {formatRelativeTime(lead.lastContactAt ?? lead.updatedAt)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/42">
                  Nenhum lead nesta etapa.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <details className="rounded-[1.75rem] border border-white/10 bg-[#111111] p-5">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                arquivados
              </p>
              <h3 className="mt-2 font-display text-2xl text-white">Perdidos</h3>
            </div>
            <span className="rounded-full bg-[#ef4444]/12 px-3 py-1 text-sm text-[#fca5a5]">
              {lostLeads.length}
            </span>
          </div>
        </summary>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lostLeads.length ? (
            lostLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/pipeline/${lead.id}`}
                className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{lead.name}</p>
                    <p className="mt-1 text-sm text-white/50">
                      {formatLeadSource(lead.source ?? "manual")}
                    </p>
                  </div>
                  <LeadStatusBadge status="perdido" />
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/42">
              Nenhum lead perdido por enquanto.
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
