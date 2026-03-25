import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDatabaseHealth } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  return (
    <DashboardShell dbHealth={getDatabaseHealth()} userId={userId}>
      {children}
    </DashboardShell>
  );
}
