import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { AgentChatClient } from "@/components/agents/AgentChatClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getConversationById,
  hasCompletedOnboarding,
} from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

function extractLeadName(
  messages: Array<{
    content: string;
    metadata?: Record<string, unknown>;
  }>,
) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const metadataLead =
      (typeof message.metadata?.leadName === "string" &&
        message.metadata.leadName) ||
      (typeof message.metadata?.clientName === "string" &&
        message.metadata.clientName) ||
      null;

    if (metadataLead) {
      return metadataLead;
    }

    const contentLead = message.content.match(
      /"(?:leadName|clientName)"\s*:\s*"([^"]+)"/i,
    );

    if (contentLead?.[1]) {
      return contentLead[1];
    }
  }

  return null;
}

export default async function ConversationDetailPage({
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
  const record = await getConversationById(id, userId);

  if (!record) {
    notFound();
  }

  const leadName = extractLeadName(record.conversation.messages ?? []);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="border-white/10 bg-[#111111]">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                conversa
              </p>
              <CardTitle className="mt-2">
                {leadName ?? "Lead nao vinculado"}
              </CardTitle>
            </div>
            <Badge variant="accent">{record.agent.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-white/62">
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              agente
            </p>
            <p className="mt-3 text-white">{record.agent.name}</p>
            <p className="text-white/50">{record.agent.type}</p>
          </div>

          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              ultima atualizacao
            </p>
            <p className="mt-3 text-white">
              {formatDateTime(record.conversation.updatedAt)}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              volume
            </p>
            <p className="mt-3 text-white">
              {record.conversation.messages.length} mensagem(ns)
            </p>
          </div>
        </CardContent>
      </Card>

      <AgentChatClient
        agentId={record.agent.id}
        agentName={record.agent.name}
        agentType={record.agent.type}
        conversationId={record.conversation.id}
        initialHistory={record.conversation.messages}
      />
    </div>
  );
}
