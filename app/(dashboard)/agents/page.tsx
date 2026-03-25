import { AgentCard } from "@/components/agents/AgentCard";
import { createAgentTeam, getDefaultCompanyProfile } from "@/lib/agents/orchestrator";

export default function AgentsPage() {
  const bundle = createAgentTeam(getDefaultCompanyProfile());

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          catalogo de agentes
        </p>
        <h1 className="mt-2 font-display text-4xl text-white">
          Especialistas prontos para ativacao
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Cada agente abaixo ja tem objetivo, canais, ferramentas e checklist
          de configuracao definidos para a operacao demo da Frya.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {bundle.agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} href={`/agents/${agent.id}`} />
        ))}
      </div>
    </div>
  );
}
