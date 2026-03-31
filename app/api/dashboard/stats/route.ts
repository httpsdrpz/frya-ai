import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByUserId, getLeadStats } from "@/lib/queries";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const company = await getCompanyByUserId(userId);

    if (!company) {
      return NextResponse.json(
        { error: "Empresa nao encontrada" },
        { status: 404 },
      );
    }

    const stats = await getLeadStats(company.id);

    return NextResponse.json({
      totalLeads: stats.totalLeads,
      statusCounts: stats.statusCounts,
      classificationCounts: stats.classificationCounts,
      averageScore: stats.averageScore,
      leadsThisWeek: stats.newThisWeek,
      qualifiedLeads: stats.qualifiedLeads,
      conversionRate: stats.conversionRate,
      followUpsPending: stats.followUpsPending,
    });
  } catch (error) {
    console.error("ERRO DASHBOARD STATS:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
