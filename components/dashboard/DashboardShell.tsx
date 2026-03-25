"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DatabaseHealth } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  dbHealth: DatabaseHealth;
  userId?: string | null;
}

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/agents", label: "Agents" },
];

export function DashboardShell({
  children,
  dbHealth,
  userId,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-6 lg:grid-cols-[280px_1fr] lg:px-10">
        <aside className="rounded-[2rem] border border-white/10 bg-surface p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              Frya.ai
            </p>
            <h1 className="font-display text-3xl text-white">IA ops cockpit</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Estrutura pronta para onboarding, ativacao e operacao dos agentes.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                banco de dados
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-white">Neon + Drizzle</p>
                <Badge variant={dbHealth.configured ? "success" : "warning"}>
                  {dbHealth.configured ? "Pronto" : "Pendente"}
                </Badge>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                autenticacao
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-white">
                  {userId ? "Conta conectada" : "Modo visitante"}
                </p>
                <Badge variant={userId ? "success" : "warning"}>
                  {userId ? "Clerk ativo" : "Sem sessao"}
                </Badge>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-2xl px-4 py-3 text-sm font-medium",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-white/6 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          <header className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                  workspace
                </p>
                <h2 className="mt-2 font-display text-3xl text-white">
                  MVP Frya para PMEs brasileiras
                </h2>
              </div>
              <Badge variant="accent">Onboarding assistido + agentes</Badge>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
