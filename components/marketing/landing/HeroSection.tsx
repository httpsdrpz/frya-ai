import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { HeroPreview } from "@/components/marketing/landing/HeroPreview";
import { ChatSimulationFallback } from "@/components/marketing/landing/ChatSimulationFallback";
import { heroPills } from "@/components/marketing/landing/content";
import { cn } from "@/lib/utils";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Badge className="w-fit rounded-full border border-[#0B6B3A]/35 bg-[#0B6B3A]/12 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#9FE1B7]">
      {children}
    </Badge>
  );
}

function LandingButton({
  href,
  children,
  tone = "primary",
}: {
  href: string;
  children: ReactNode;
  tone?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-14 items-center justify-center rounded-full px-7 text-sm font-medium transition-[transform,box-shadow,background-color,border-color] duration-300 hover:scale-[1.02] sm:px-8 sm:text-base",
        tone === "primary"
          ? "border border-[#0B6B3A]/55 bg-[#0B6B3A] text-white shadow-[0_18px_48px_rgba(11,107,58,0.2)] hover:bg-[#0E7A43] hover:shadow-[0_20px_56px_rgba(11,107,58,0.28)]"
          : "border border-white/12 bg-white/[0.04] text-white/84 hover:border-white/20 hover:bg-white/[0.08]",
      )}
    >
      {children}
    </Link>
  );
}

export function HeroSection() {
  return (
    <section className="grid gap-16 pt-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:pt-12">
      <div className="space-y-8">
        <Eyebrow>Sistema para vendas no WhatsApp</Eyebrow>

        <div className="space-y-6">
          <h1 className="max-w-5xl text-balance text-5xl font-semibold leading-[0.88] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
            <span className="block">Voce perde clientes todo dia.</span>
            <span className="block text-white/84">
              Frya responde antes disso virar prejuizo.
            </span>
          </h1>

          <div className="max-w-2xl space-y-3 text-base leading-8 text-white/62 sm:text-lg">
            <p>Ela atende na hora.</p>
            <p>Faz follow-up.</p>
            <p>Agenda o proximo passo sem alguem lembrar.</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.28em] text-[#9FE1B7]">
            nao e painel
          </p>
          <p className="mt-3 max-w-xl text-xl leading-8 text-white/86 sm:text-2xl">
            E um sistema rodando por voce. Mesmo quando o time nao esta online.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <LandingButton href="/sign-up">Comecar gratis</LandingButton>
          <LandingButton href="#operacao" tone="secondary">
            Ver o sistema
          </LandingButton>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-white/52">
          {heroPills.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

      <Suspense fallback={<ChatSimulationFallback />}>
        <HeroPreview />
      </Suspense>
    </section>
  );
}
