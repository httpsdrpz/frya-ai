import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAgentsByUserId,
  getCompanyByUserId,
  hasCompletedOnboarding,
} from "@/lib/queries";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Redireciona pro onboarding se ainda nao completou
  const onboarded = await hasCompletedOnboarding(userId);
  if (!onboarded) {
    redirect("/onboarding");
  }

  const [company, agentsList] = await Promise.all([
    getCompanyByUserId(userId),
    getAgentsByUserId(userId),
  ]);

  const activeAgents = agentsList.filter((a) => a.status === "active");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Agentes ativos", String(activeAgents.length)],
          ["Total de agentes", String(agentsList.length)],
          ["Segmento", company?.segment ?? "-"],
          ["Plano", "Free"],
        ].map(([label, value]) => (
          <Card key={label} className="border-white/12 bg-surface-strong/80">
            <CardContent className="mt-0 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {label}
              </p>
              <p className="font-display text-4xl text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {company && (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/12 bg-surface-strong/80">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{company.name}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {company.segment} / {company.size} pessoas
                  </p>
                </div>
                <Badge variant="accent">{company.segment}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    principal dor
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {company.mainPain ?? "-"}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    cliente ideal
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {company.icp ?? "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/12 bg-surface-strong/80">
            <CardHeader>
              <CardTitle>Proximos passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>1. Conectar WhatsApp ao agente SDR.</p>
              <p>2. Testar primeiro follow-up automatico.</p>
              <p>3. Acompanhar metricas de resposta.</p>
              <p>4. Upgrade pro plano Pro quando escalar.</p>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            seu time
          </p>
          <h2 className="mt-2 font-display text-3xl text-white">
            Agentes configurados para sua operacao
          </h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {agentsList.map((agent) => (
            <Card key={agent.id} className="border-white/12 bg-surface-strong/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{agent.name}</CardTitle>
                  <Badge variant={agent.status === "active" ? "success" : "accent"}>
                    {agent.status === "active" ? "Ativo" : agent.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground capitalize">{agent.type}</p>
              </CardHeader>
              <CardContent>
                <a
                  href={`/agents/${agent.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Abrir agente {"->"}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
