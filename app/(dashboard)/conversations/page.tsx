import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRecentConversations,
  hasCompletedOnboarding,
} from "@/lib/queries";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { AgentKey } from "@/types";

const agentFilters: Array<{ value: AgentKey; label: string }> = [
  { value: "sdr", label: "SDR" },
  { value: "cs", label: "CS" },
  { value: "financeiro", label: "Financeiro" },
  { value: "marketing", label: "Marketing" },
];

function isAgentKey(value: string): value is AgentKey {
  return ["sdr", "cs", "financeiro", "marketing"].includes(value);
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const onboarded = await hasCompletedOnboarding(userId);

  if (!onboarded) {
    redirect("/onboarding");
  }

  const { agent } = await searchParams;
  const activeFilter = agent && isAgentKey(agent) ? agent : undefined;
  const conversations = await getRecentConversations(userId, 50, {
    agentType: activeFilter,
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap gap-2">
        <Link
          href="/conversations"
          className={`rounded-full px-4 py-2 text-sm ${
            !activeFilter
              ? "bg-[#22c55e] text-[#04110a]"
              : "bg-white/[0.04] text-white/60"
          }`}
        >
          Todos
        </Link>
        {agentFilters.map((filter) => (
          <Link
            key={filter.value}
            href={`/conversations?agent=${filter.value}`}
            className={`rounded-full px-4 py-2 text-sm ${
              activeFilter === filter.value
                ? "bg-[#22c55e] text-[#04110a]"
                : "bg-white/[0.04] text-white/60"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </section>

      <Card className="border-white/10 bg-[#111111]">
        <CardHeader>
          <CardTitle>Conversas ativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversations.length ? (
            conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className="block rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#22c55e]/28 hover:bg-white/[0.05]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">
                      {conversation.leadName ?? "Lead nao vinculado"}
                    </p>
                    <p className="mt-1 text-sm text-white/52">
                      {conversation.agentName} / {conversation.agentType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">
                      {formatRelativeTime(conversation.lastMessageAt)}
                    </Badge>
                    <span className="text-xs text-white/40">
                      {formatDateTime(conversation.updatedAt)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/66">
                  {conversation.preview}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/55">
              Nenhuma conversa encontrada para este filtro.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
