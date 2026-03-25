import { Badge } from "@/components/ui/badge";
import { formatAgentState } from "@/lib/utils";
import type { AgentState } from "@/types";

interface AgentStatusProps {
  status: AgentState;
}

export function AgentStatus({ status }: AgentStatusProps) {
  const variant =
    status === "active" ? "success" : status === "configuring" ? "accent" : "muted";

  return <Badge variant={variant}>{formatAgentState(status)}</Badge>;
}
