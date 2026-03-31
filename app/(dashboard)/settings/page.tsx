import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDatabaseHealth } from "@/lib/db";
import {
  getAgentsByUserId,
  getCompanyByUserId,
  hasCompletedOnboarding,
} from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const onboarded = await hasCompletedOnboarding(userId);

  if (!onboarded) {
    redirect("/onboarding");
  }

  const [company, agentsList] = await Promise.all([
    getCompanyByUserId(userId),
    getAgentsByUserId(userId),
  ]);

  if (!company) {
    redirect("/onboarding");
  }

  const dbHealth = getDatabaseHealth();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="border-white/10 bg-[#111111]">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            empresa
          </p>
          <CardTitle className="mt-2">{company.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-white/62">
          <p>
            Segmento: <span className="text-white">{company.segment ?? "-"}</span>
          </p>
          <p>
            Porte: <span className="text-white">{company.size ?? "-"}</span>
          </p>
          <p>
            Produto: <span className="text-white">{company.product ?? "-"}</span>
          </p>
          <p>
            ICP: <span className="text-white">{company.icp ?? "-"}</span>
          </p>
          <p>
            Tom: <span className="text-white">{company.tone ?? "-"}</span>
          </p>
          <p>
            Criada em <span className="text-white">{formatDateTime(company.createdAt)}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#111111]">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            stack
          </p>
          <CardTitle className="mt-2">Infra atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="text-sm text-white/62">Banco</span>
            <Badge variant={dbHealth.configured ? "success" : "warning"}>
              {dbHealth.configured ? "Neon conectado" : "Pendente"}
            </Badge>
          </div>

          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-white/62">
              Agentes configurados: <span className="text-white">{agentsList.length}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {agentsList.map((agent) => (
                <Badge key={agent.id} variant={agent.status === "active" ? "success" : "muted"}>
                  {agent.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
