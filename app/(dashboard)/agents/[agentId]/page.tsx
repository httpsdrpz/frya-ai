import { notFound } from "next/navigation";
import { AgentChat } from "@/components/agents/AgentChat";
import { AgentStatus } from "@/components/agents/AgentStatus";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAgentById,
  getAgentOpeningMessage,
  getDefaultCompanyProfile,
} from "@/lib/agents/orchestrator";
import { formatPercent } from "@/lib/utils";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const company = getDefaultCompanyProfile();
  const agent = getAgentById(agentId, company);

  if (!agent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card className="border-white/12 bg-surface-strong/80">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Badge variant="accent">{agent.sector}</Badge>
                <CardTitle className="mt-4">{agent.name}</CardTitle>
              </div>
              <AgentStatus status={agent.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                objetivo
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {agent.objective}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  prontidao
                </p>
                <p className="mt-3 font-display text-4xl text-white">
                  {formatPercent(agent.readiness)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{agent.tone}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  canais
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.channels.map((channel) => (
                    <Badge key={channel} variant="default">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  checklist
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  {agent.checklist.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  metricas foco
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  {agent.metrics.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/12 bg-surface-strong/80">
          <CardHeader>
            <CardTitle>Capacidades do agente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agent.capabilities.map((capability) => (
              <div
                key={capability.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-white">{capability.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {capability.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <AgentChat
        agentId={agent.id}
        agentName={agent.name}
        objective={agent.objective}
        openingMessage={getAgentOpeningMessage(agent, company)}
      />
    </div>
  );
}
