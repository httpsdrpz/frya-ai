import Link from "next/link";
import { AgentStatus } from "@/components/agents/AgentStatus";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";
import type { AgentDefinition } from "@/types";

interface AgentCardProps {
  agent: AgentDefinition;
  href?: string;
}

export function AgentCard({ agent, href }: AgentCardProps) {
  const content = (
    <Card className="h-full border-white/12 bg-surface-strong/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="accent">{agent.sector}</Badge>
            <CardTitle className="mt-4">{agent.name}</CardTitle>
          </div>
          <AgentStatus status={agent.status} />
        </div>
        <CardDescription>{agent.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            prontidao
          </p>
          <p className="mt-2 text-3xl font-display text-white">
            {formatPercent(agent.readiness)}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {agent.objective}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            principais entregas
          </p>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            {agent.capabilities.slice(0, 2).map((capability) => (
              <li key={capability.title}>• {capability.title}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}
