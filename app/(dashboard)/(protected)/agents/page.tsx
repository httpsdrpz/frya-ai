import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentsByUserId } from "@/lib/queries";

export default async function AgentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const agentsList = await getAgentsByUserId(userId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          seu time de ia
        </p>
        <h1 className="mt-2 font-display text-4xl text-white">Agentes</h1>
      </div>

      {agentsList.length === 0 ? (
        <Card className="border-white/12 bg-surface-strong/80">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum agente ainda.</p>
            <a href="/onboarding" className="mt-4 block text-primary hover:underline">
              Fazer onboarding para criar agentes {"->"}
            </a>
          </CardContent>
        </Card>
      ) : (
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
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {agent.systemPrompt?.slice(0, 120)}...
                </p>
                <a
                  href={`/agents/${agent.id}`}
                  className="mt-3 block text-xs text-primary hover:underline"
                >
                  Abrir e conversar {"->"}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
