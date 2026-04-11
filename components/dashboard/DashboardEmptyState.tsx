import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardEmptyStateProps {
  title: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function DashboardEmptyState({
  title,
  description = "Nenhum dado registrado ainda. Mande uma mensagem pro seu secretario!",
  ctaHref = "/onboarding",
  ctaLabel = "Revisar configuracao",
}: DashboardEmptyStateProps) {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
      <p className="text-xs uppercase tracking-[0.34em] text-[#00FF88]">
        Frya AI
      </p>
      <h3 className="mt-4 font-display text-2xl text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/62">
        {description}
      </p>
      <div className="mt-6">
        <Link href={ctaHref}>
          <Button className="bg-[#00FF88] text-[#04110a] hover:bg-[#66ffb2]">
            {ctaLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
