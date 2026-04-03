import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDatabaseHealth } from "@/lib/db";
import { getOnboardingStateByUserId } from "@/lib/onboarding-setup";

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

  const onboardingState = await getOnboardingStateByUserId(userId);

  if (!onboardingState.completed || !onboardingState.company) {
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
      companyName={onboardingState.company.name}
    >
      {children}
    </DashboardShell>
  );
}
