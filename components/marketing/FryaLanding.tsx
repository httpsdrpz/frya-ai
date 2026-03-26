import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HeroSection } from "@/components/marketing/landing/HeroSection";
import { LandingBackground } from "@/components/marketing/landing/LandingBackground";
import {
  automationCards,
  leakCards,
  operatingMetrics,
  operatingNotes,
} from "@/components/marketing/landing/content";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.32em] text-[#9FE1B7]">
      {children}
    </p>
  );
}

function CTAButton({
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

export function FryaLanding({ className }: { className?: string }) {
  return (
    <main className={cn(className, "relative isolate overflow-hidden bg-[#020403] text-white")}>
      <LandingBackground />

      <div className="relative mx-auto flex w-full max-w-[1460px] flex-col gap-24 px-6 pb-24 pt-8 sm:px-8 sm:pb-28 lg:gap-28 lg:px-12 lg:pb-32">
        <HeroSection />

        <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-6">
            <Eyebrow>Onde o dinheiro some</Eyebrow>
            <h2 className="max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
              Seu WhatsApp nao perde no volume.
              <br />
              Perde no atraso.
            </h2>
            <p className="max-w-xl text-lg leading-8 text-white/60">
              O lead entra quente. A demora derruba o interesse. O caixa sente
              depois.
            </p>

            <Card className="rounded-[2rem] border-[#F2C94C]/16 bg-[#F2C94C]/8 p-6 shadow-[0_24px_90px_rgba(242,201,76,0.08)]">
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#F2C94C]">
                custo invisivel
              </p>
              <p className="mt-4 text-2xl leading-9 text-white sm:text-[2rem]">
                Nao falta lead.
                <br />
                Falta resposta no tempo certo.
              </p>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {leakCards.map((card) => (
              <Card
                key={card.label}
                className="h-full rounded-[2rem] border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">
                  {card.label}
                </p>
                <p className="mt-8 text-5xl font-semibold tracking-[-0.06em] text-white">
                  {card.value}
                </p>
                <p className="mt-4 text-sm leading-7 text-white/56">{card.copy}</p>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="operacao"
          className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start"
        >
          <div className="space-y-6">
            <Eyebrow>Frya em operacao</Eyebrow>
            <h2 className="max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
              Frya entra no meio da conversa e segura o ritmo.
            </h2>
            <p className="max-w-xl text-lg leading-8 text-white/60">
              Ela confirma interesse, manda horario, registra contexto e reativa
              quem sumiu.
            </p>

            <Card className="overflow-hidden rounded-[2.2rem] border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(11,107,58,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-7 shadow-[0_28px_110px_rgba(0,0,0,0.35)]">
              <p className="max-w-lg text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-4xl">
                Nao e mais um painel.
                <br />
                E uma camada de operacao.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {operatingNotes.map((note) => (
                  <span
                    key={note}
                    className="rounded-full border border-white/10 bg-black/24 px-4 py-2 text-sm text-white/70"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4">
            {automationCards.map((card) => (
              <Card
                key={card.title}
                className="rounded-[2rem] border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[#0B6B3A]/35"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                      {card.title}
                    </p>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
                      {card.copy}
                    </p>
                  </div>
                  <div className="mt-1 h-10 w-10 rounded-full border border-[#0B6B3A]/24 bg-[#0B6B3A]/10" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Eyebrow>O que muda no caixa</Eyebrow>
              <h2 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
                Quando o fluxo fica vivo, a receita fica mais previsivel.
              </h2>
            </div>
            <p className="max-w-md text-lg leading-8 text-white/56">
              O time para de correr atras de lembrete. A operacao fica acordada o
              dia inteiro.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="grid gap-4 sm:grid-cols-3">
              {operatingMetrics.map((metric) => (
                <Card
                  key={metric.label}
                  className="h-full rounded-[1.9rem] border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/36">
                    {metric.label}
                  </p>
                  <p className="mt-6 text-5xl font-semibold tracking-[-0.06em] text-white">
                    {metric.value}
                  </p>
                </Card>
              ))}
            </div>

            <Card className="h-full rounded-[2.2rem] border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(11,107,58,0.2),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_28px_110px_rgba(0,0,0,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#9FE1B7]">
                sistema trabalhando
              </p>
              <p className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-4xl">
                Enquanto a equipe fecha, Frya protege o resto do funil.
              </p>
              <p className="mt-5 max-w-lg text-base leading-8 text-white/60">
                Menos espera. Menos esquecimento. Mais conversa andando sem atrito.
              </p>
            </Card>
          </div>
        </section>

        <section className="pb-4">
          <Card className="overflow-hidden rounded-[2.6rem] border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(11,107,58,0.22),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_36px_140px_rgba(0,0,0,0.42)] sm:p-10 lg:p-12">
            <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-5">
                <Eyebrow>Ative a Frya</Eyebrow>
                <div className="space-y-4">
                  <h2 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
                    Pare de deixar dinheiro parado no WhatsApp.
                  </h2>
                  <p className="max-w-2xl text-lg leading-8 text-white/60">
                    Em minutos, a operacao comeca a responder, lembrar e puxar o
                    proximo passo por voce.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <CTAButton href="/sign-up">Comecar gratis agora</CTAButton>
                <CTAButton href="/sign-in" tone="secondary">
                  Entrar
                </CTAButton>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
