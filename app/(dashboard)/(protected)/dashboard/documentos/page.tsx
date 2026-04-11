import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DocumentsGrid } from "@/components/dashboard/DocumentsGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDashboardWorkspaceByUserId,
  getDocumentsPageData,
  toNumber,
} from "@/lib/frya-dashboard";

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    redirect("/onboarding");
  }

  const filters = await searchParams;
  const documentsData = await getDocumentsPageData(workspace.tenant.id, {
    period: pickValue(filters.period) ?? "30d",
    from: pickValue(filters.from),
    to: pickValue(filters.to),
    type: pickValue(filters.type) ?? "all",
  });

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-[#111111]">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Acervo
              </p>
              <CardTitle className="mt-2">Documentos armazenados</CardTitle>
            </div>
            <div className="text-sm text-white/58">
              {documentsData.totalCount} documentos no filtro atual
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70">
              <select
                className="h-11 w-full bg-transparent outline-none"
                defaultValue={pickValue(filters.type) ?? "all"}
                name="type"
              >
                <option value="all">Todos os tipos</option>
                <option value="nf">NF</option>
                <option value="cupom">Cupom</option>
                <option value="comprovante">Comprovante</option>
                <option value="contrato">Contrato</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            <label className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70">
              <select
                className="h-11 w-full bg-transparent outline-none"
                defaultValue={pickValue(filters.period) ?? "30d"}
                name="period"
              >
                <option value="7d">Ultimos 7 dias</option>
                <option value="30d">Ultimos 30 dias</option>
                <option value="90d">Ultimos 90 dias</option>
                <option value="month">Mes atual</option>
                <option value="all">Tudo</option>
              </select>
            </label>
            <input
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
              defaultValue={pickValue(filters.from) ?? ""}
              name="from"
              type="date"
            />
            <div className="flex gap-3">
              <input
                className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                defaultValue={pickValue(filters.to) ?? ""}
                name="to"
                type="date"
              />
              <button
                className="rounded-full bg-[#00FF88] px-5 text-sm font-medium text-[#04110a]"
                type="submit"
              >
                Filtrar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {documentsData.rows.length ? (
        <DocumentsGrid
          rows={documentsData.rows.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
            linkedSale: row.linkedSale
              ? {
                  ...row.linkedSale,
                  totalValue: toNumber(row.linkedSale.totalValue),
                }
              : null,
          }))}
        />
      ) : (
        <DashboardEmptyState
          ctaHref="/dashboard"
          ctaLabel="Abrir inicio"
          description="Nenhum documento apareceu aqui ainda. Assim que a Frya guardar uma NF, cupom ou comprovante, voce ve tudo neste grid."
          title="Seu acervo ainda esta vazio."
        />
      )}
    </div>
  );
}
