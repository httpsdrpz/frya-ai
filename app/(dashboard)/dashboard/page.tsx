import { AgentCard } from "@/components/agents/AgentCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAgentTeam, getDefaultCompanyProfile } from "@/lib/agents/orchestrator";
import { getDatabaseHealth } from "@/lib/db";

export default function DashboardPage() {
  const company = getDefaultCompanyProfile();
  const bundle = createAgentTeam(company);
  const dbHealth = getDatabaseHealth();
  const readinessAverage = Math.round(
    bundle.agents.reduce((total, agent) => total + agent.readiness, 0) /
      bundle.agents.length,
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Agentes no time", String(bundle.agents.length)],
          ["Prontidao media", `${readinessAverage}%`],
          ["Canais mapeados", String(company.salesChannels.length)],
          ["Banco de dados", dbHealth.configured ? "Conectado" : "Pendente"],
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

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/12 bg-surface-strong/80">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>{company.businessName}</CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {company.description}
                </p>
              </div>
              <Badge variant="accent">{company.industry}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  dores principais
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  {company.painPoints.map((pain) => (
                    <li key={pain}>• {pain}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  objetivos imediatos
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  {company.goals.map((goal) => (
                    <li key={goal}>• {goal}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/12 bg-surface-strong/80">
          <CardHeader>
            <CardTitle>Proximos passos do MVP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>1. Conectar autenticacao real com Clerk.</p>
            <p>2. Persistir companies, agents e chats com Drizzle + Neon.</p>
            <p>3. Trocar respostas mock por inferencia via Claude.</p>
            <p>4. Plugar billing e planos no Stripe.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            time recomendado
          </p>
          <h2 className="mt-2 font-display text-3xl text-white">
            Agentes montados para a operacao atual
          </h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {bundle.agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} href={`/agents/${agent.id}`} />
          ))}
        </div>
      </section>
    </div>
  );
}
