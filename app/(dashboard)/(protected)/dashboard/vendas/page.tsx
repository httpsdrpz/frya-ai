import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { SalesWorkspaceTools } from "@/components/dashboard/SalesWorkspaceTools";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDashboardWorkspaceByUserId,
  getSalesPageData,
  toNumber,
} from "@/lib/frya-dashboard";
import {
  formatCurrency,
  formatDate,
  formatSalePaymentStatus,
} from "@/lib/utils";

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function badgeVariant(status: string) {
  switch (status) {
    case "paid":
      return "success";
    case "overdue":
      return "danger";
    default:
      return "warning";
  }
}

export default async function SalesPage({
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
  const salesData = await getSalesPageData(workspace.tenant.id, {
    period: pickValue(filters.period) ?? "30d",
    from: pickValue(filters.from),
    to: pickValue(filters.to),
    paymentStatus: pickValue(filters.paymentStatus) ?? "all",
    paymentMethod: pickValue(filters.paymentMethod) ?? "all",
  });
  const paymentMethods = Array.from(
    new Set([
      ...(workspace.businessProfile?.paymentMethods ?? []),
      ...salesData.rows.map((row) => row.paymentMethod),
    ]),
  );

  return (
    <div className="space-y-6">
      <SalesWorkspaceTools
        rows={salesData.rows.map((row) => ({
          ...row,
          saleDate: row.saleDate.toISOString(),
          unitPrice: toNumber(row.unitPrice),
          totalValue: toNumber(row.totalValue),
          createdAt: row.createdAt.toISOString(),
        }))}
      />

      <Card className="border-white/10 bg-[#111111]">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Filtros
              </p>
              <CardTitle className="mt-2">Vendas registradas</CardTitle>
            </div>
            <div className="text-sm text-white/58">
              {salesData.totalCount} vendas / {formatCurrency(salesData.totalValue)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
            <label className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70">
              <select
                className="h-11 w-full bg-transparent outline-none"
                defaultValue={pickValue(filters.paymentStatus) ?? "all"}
                name="paymentStatus"
              >
                <option value="all">Todos os status</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Atrasado</option>
              </select>
            </label>
            <label className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70">
              <select
                className="h-11 w-full bg-transparent outline-none"
                defaultValue={pickValue(filters.paymentMethod) ?? "all"}
                name="paymentMethod"
              >
                <option value="all">Todas as formas</option>
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {paymentMethod}
                  </option>
                ))}
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

      {salesData.rows.length ? (
        <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#111111]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-white/48">
                <tr>
                  <th className="px-5 py-4 font-medium">Data</th>
                  <th className="px-5 py-4 font-medium">Cliente</th>
                  <th className="px-5 py-4 font-medium">Produto</th>
                  <th className="px-5 py-4 font-medium">Valor</th>
                  <th className="px-5 py-4 font-medium">Pagamento</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {salesData.rows.map((row) => (
                  <tr key={row.id} className="border-t border-white/8">
                    <td className="px-5 py-4 text-white/72">{formatDate(row.saleDate)}</td>
                    <td className="px-5 py-4">
                      <p className="text-white">{row.customerName}</p>
                      <p className="mt-1 text-xs text-white/45">{row.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white">{row.productOrService}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {row.quantity} x {formatCurrency(row.unitPrice)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-white">
                      {formatCurrency(row.totalValue)}
                    </td>
                    <td className="px-5 py-4 text-white/68">{row.paymentMethod}</td>
                    <td className="px-5 py-4">
                      <Badge variant={badgeVariant(row.paymentStatus)}>
                        {formatSalePaymentStatus(row.paymentStatus)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <DashboardEmptyState
          ctaHref="/dashboard"
          ctaLabel="Voltar ao inicio"
          title="Nenhuma venda registrada ainda."
        />
      )}
    </div>
  );
}
