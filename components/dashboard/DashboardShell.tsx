"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn, formatTenantPlan } from "@/lib/utils";
import type { DatabaseHealth } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  dbHealth: DatabaseHealth;
  userId?: string | null;
  userLabel: string;
  companyName: string;
  plan: string;
}

const navigation = [
  { href: "/dashboard", label: "Inicio", short: "Inicio" },
  { href: "/dashboard/vendas", label: "Vendas", short: "Vendas" },
  { href: "/dashboard/documentos", label: "Documentos", short: "Docs" },
  { href: "/dashboard/cobrancas", label: "Cobrancas", short: "Cobr." },
  { href: "/dashboard/agenda", label: "Agenda", short: "Agenda" },
  {
    href: "/dashboard/configuracoes",
    label: "Configuracoes",
    short: "Ajustes",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  children,
  dbHealth,
  userId,
  userLabel,
  companyName,
  plan,
}: DashboardShellProps) {
  const pathname = usePathname();
  const currentSection =
    navigation.reduce<{ href: string; label: string } | null>((match, item) => {
      if (!isActive(pathname, item.href)) {
        return match;
      }

      if (!match || item.href.length > match.href.length) {
        return { href: item.href, label: item.label };
      }

      return match;
    }, null)?.label ?? "Inicio";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[1600px] gap-6 px-4 py-4 pb-24 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8 lg:pb-6">
        <aside className="hidden h-fit rounded-[2rem] border border-white/10 bg-[#111111] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)] lg:sticky lg:top-24 lg:flex lg:flex-col">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-[#00FF88]">
              Frya.ai
            </p>
            <h1 className="font-display text-3xl text-white">
              Seu secretario em operacao
            </h1>
            <p className="text-sm leading-6 text-white/62">
              Vendas, documentos, cobrancas e agenda reunidos em um unico cockpit.
            </p>
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-[#00FF88]/20 bg-[#0d0d0d] p-4 shadow-[inset_0_0_0_1px_rgba(0,255,136,0.05)]">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">
              empresa
            </p>
            <p className="mt-3 text-lg text-white">{companyName}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-white/55">{userLabel}</p>
              <Badge className="bg-[#00FF88]/16 text-[#7CFFBF]">
                {formatTenantPlan(plan)}
              </Badge>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-[1.35rem] px-4 py-3 text-sm font-medium",
                    active
                      ? "bg-[#171717] text-white shadow-[inset_0_0_0_1px_rgba(0,255,136,0.26)]"
                      : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  <span>{item.label}</span>
                  {active ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#00FF88]" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                banco
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-white">Neon + Drizzle</p>
                <Badge variant={dbHealth.configured ? "success" : "warning"}>
                  {dbHealth.configured ? "Conectado" : "Pendente"}
                </Badge>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                sessao
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-white">
                  {userId ? "Clerk ativo" : "Sem sessao"}
                </p>
                <Badge variant={userId ? "success" : "warning"}>
                  {userId ? "Protegido" : "Visitante"}
                </Badge>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <header className="sticky top-[88px] z-20 rounded-[2rem] border border-white/10 bg-[#111111]/92 px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/40">
                  workspace
                </p>
                <h2 className="mt-2 font-display text-3xl text-white">
                  {currentSection}
                </h2>
                <p className="mt-2 text-sm text-white/58">
                  {companyName} / Plano {formatTenantPlan(plan)}
                </p>
              </div>
              <div className="flex items-center gap-3 self-start md:self-auto">
                <Badge className="bg-[#00FF88]/14 text-[#7CFFBF]">
                  Secretario online
                </Badge>
                <div className="hidden sm:block">
                  <UserButton />
                </div>
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-50 rounded-[1.75rem] border border-white/10 bg-[#121212]/95 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-6 gap-2">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[1.2rem] px-2 py-3 text-center text-[11px] font-medium",
                  active
                    ? "bg-[#1d1d1d] text-white shadow-[inset_0_0_0_1px_rgba(0,255,136,0.24)]"
                    : "text-white/55",
                )}
              >
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
