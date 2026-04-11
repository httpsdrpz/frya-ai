import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import {
  getDashboardWorkspaceByUserId,
  getSettingsPageData,
} from "@/lib/frya-dashboard";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    redirect("/onboarding");
  }

  const settings = await getSettingsPageData(workspace.tenant.id);

  return (
    <SettingsPanel
      actionSchemas={settings.actionSchemas}
      businessProfile={settings.businessProfile}
      tenant={settings.tenant}
      whatsappStatus={settings.whatsappStatus}
    />
  );
}
