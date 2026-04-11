import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getDashboardSummary,
  getDashboardWorkspaceByUserId,
} from "@/lib/frya-dashboard";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nao encontrado." }, { status: 404 });
  }

  const summary = await getDashboardSummary(workspace.tenant.id);

  return NextResponse.json({
    ...summary,
    nextAppointment: summary.nextAppointment
      ? {
          ...summary.nextAppointment,
          scheduledAt: summary.nextAppointment.scheduledAt.toISOString(),
          reminderAt: summary.nextAppointment.reminderAt?.toISOString() ?? null,
          createdAt: summary.nextAppointment.createdAt.toISOString(),
        }
      : null,
    recentActivities: summary.recentActivities.map((activity) => ({
      ...activity,
      createdAt: activity.createdAt.toISOString(),
    })),
  });
}
