import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDatabaseHealth } from "@/lib/db";
import { getCompanyByUserId } from "@/lib/queries";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const company = await getCompanyByUserId(userId);
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
      companyName={company?.name ?? "Empresa em configuracao"}
    >
      {children}
    </DashboardShell>
  );
}
