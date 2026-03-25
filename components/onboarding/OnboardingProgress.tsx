import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AgentKey, OnboardingAnalysis } from "@/types";

const agentLabels: Record<AgentKey, string> = {
  sdr: "SDR",
  cs: "CS",
  financeiro: "Financeiro",
  marketing: "Marketing",
};

interface OnboardingProgressProps {
  analysis: OnboardingAnalysis;
}

export function OnboardingProgress({ analysis }: OnboardingProgressProps) {
  return (
    <Card className="border-white/12 bg-surface-strong/80">
      <CardHeader>
        <CardTitle>Progresso do onboarding</CardTitle>
        <CardDescription>
          A Frya consolida o contexto da operacao e sugere o time de agentes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Completude do diagnostico</span>
            <span>{analysis.completion}%</span>
          </div>
          <Progress value={analysis.completion} />
          <p className="text-sm leading-6 text-muted-foreground">
            {analysis.summary}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            dados mapeados
          </p>
          <div className="grid gap-3">
            {analysis.insights.map((insight) => (
              <div
                key={insight.key}
                className="rounded-3xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{insight.label}</p>
                  <Badge variant={insight.completed ? "success" : "warning"}>
                    {insight.completed ? "Preenchido" : "Pendente"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {insight.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            agentes sugeridos
          </p>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedAgents.map((agentId) => (
              <Badge key={agentId} variant="accent">
                {agentLabels[agentId]}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
