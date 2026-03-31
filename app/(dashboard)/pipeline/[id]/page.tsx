import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { LeadClassificationBadge, LeadStatusBadge } from "@/components/dashboard/LeadBadges";
import { LeadEditor } from "@/components/dashboard/LeadEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getLeadById,
  getLeadConversations,
  hasCompletedOnboarding,
} from "@/lib/queries";
import {
  formatDateTime,
  formatLeadSource,
  formatRelativeTime,
} from "@/lib/utils";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const onboarded = await hasCompletedOnboarding(userId);

  if (!onboarded) {
    redirect("/onboarding");
  }

  const { id } = await params;
  const [lead, conversations] = await Promise.all([
    getLeadById(id, userId),
    getLeadConversations(id, userId),
  ]);

  if (!lead) {
    notFound();
  }

  const latestConversation = conversations[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-white/10 bg-[#111111]">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  lead
                </p>
                <CardTitle className="mt-2">{lead.name}</CardTitle>
              </div>
              <div className="flex gap-2">
                <LeadStatusBadge status={lead.status} />
                <LeadClassificationBadge
                  classification={lead.classification ?? "unscored"}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  contato
                </p>
                <p className="mt-3 text-sm text-white/70">
                  {lead.phone ?? "Sem telefone"}
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {lead.email ?? "Sem email"}
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  origem e score
                </p>
                <p className="mt-3 text-sm text-white/70">
                  {formatLeadSource(lead.source ?? "manual")}
                </p>
                <p className="mt-1 text-sm text-white/50">Score {lead.score ?? 0}/100</p>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                principal dor
              </p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                {lead.mainPain ?? "Ainda nao registrada."}
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                proximo passo
              </p>
              <p className="mt-3 text-sm text-white/70">
                {lead.nextStep ?? "Nenhum proximo passo definido."}
              </p>
              <p className="mt-1 text-sm text-white/50">
                {lead.nextStepAt
                  ? `Agendado para ${formatDateTime(lead.nextStepAt)}`
                  : "Sem horario agendado"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  ultimo contato
                </p>
                <p className="mt-3 text-sm text-white/70">
                  {formatRelativeTime(lead.lastContactAt ?? lead.updatedAt)}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  criado em
                </p>
                <p className="mt-3 text-sm text-white/70">
                  {formatDateTime(lead.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <LeadEditor
            leadId={lead.id}
            initialStatus={lead.status}
            initialNotes={lead.notes ?? ""}
            initialNextStep={lead.nextStep ?? ""}
            initialNextStepAt={lead.nextStepAt?.toISOString() ?? null}
          />

          <Card className="border-white/10 bg-[#111111]">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    historico
                  </p>
                  <CardTitle className="mt-2">Conversa recente</CardTitle>
                </div>
                {latestConversation ? (
                  <Link
                    href={`/conversations/${latestConversation.id}`}
                    className="text-sm text-[#22c55e]"
                  >
                    Abrir conversa
                  </Link>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {latestConversation ? (
                <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/62">
                      {latestConversation.agentName} / {latestConversation.agentType}
                    </p>
                    <p className="text-xs text-white/45">
                      {formatDateTime(latestConversation.updatedAt)}
                    </p>
                  </div>

                  {latestConversation.messages.slice(-8).map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`max-w-[85%] rounded-[1.4rem] px-4 py-3 text-sm leading-7 ${
                        message.role === "user"
                          ? "ml-auto bg-[#22c55e] text-[#04110a]"
                          : "bg-white/[0.07] text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/55">
                  Ainda nao encontramos uma conversa vinculada a este lead.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
