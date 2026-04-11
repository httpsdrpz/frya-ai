import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDatabaseHealth } from "@/lib/db";
import { getDashboardWorkspaceByUserId } from "@/lib/frya-dashboard";

export default async function ProtectedDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const workspace = await getDashboardWorkspaceByUserId(userId);

  if (!workspace) {
    redirect("/onboarding");
  }

  const userLabel =
    user?.firstName ??
    user?.fullName ??
    user?.emailAddresses[0]?.emailAddress ??
    "Workspace";

  return (
    <DashboardShell
      dbHealth={getDatabaseHealth()}
      userId={userId}
      userLabel={userLabel}
      companyName={
        workspace.businessProfile?.businessName ?? workspace.tenant.name
      }
      plan={workspace.tenant.plan}
    >
      {children}
    </DashboardShell>
  );
}
