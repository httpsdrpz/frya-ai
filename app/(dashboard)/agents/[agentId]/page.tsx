import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { AgentChatClient } from "@/components/agents/AgentChatClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentById, getConversationByAgent } from "@/lib/queries";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { agentId } = await params;
  const agent = await getAgentById(agentId, userId);

  if (!agent) notFound();

  const conversation = await getConversationByAgent(agentId);
  const history =
    (conversation?.messages as { role: string; content: string }[]) ?? [];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card className="border-white/12 bg-surface-strong/80">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Badge variant="accent">{agent.type}</Badge>
                <CardTitle className="mt-4">{agent.name}</CardTitle>
              </div>
              <Badge variant={agent.status === "active" ? "success" : "default"}>
                {agent.status === "active" ? "Ativo" : agent.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                tipo
              </p>
              <p className="mt-2 text-sm capitalize text-muted-foreground">
                {agent.type}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                system prompt
              </p>
              <p className="mt-2 line-clamp-6 text-xs leading-6 text-muted-foreground">
                {agent.systemPrompt}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                criado em
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {new Date(agent.createdAt!).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </CardContent>
        </Card>

        <AgentChatClient
          agentId={agent.id}
          agentName={agent.name}
          agentType={agent.type}
          initialHistory={history}
        />
      </section>
    </div>
  );
}
