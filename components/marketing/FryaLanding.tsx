import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    title: "Conta sobre sua empresa",
    copy:
      "Em 2 minutos, a Frya entende o que voce vende, quem voce quer atrair e como deve conversar.",
  },
  {
    number: "02",
    title: "Conecta o WhatsApp",
    copy:
      "Use seu numero atual e deixe a Frya assumir a primeira resposta, a qualificacao e o follow-up.",
  },
  {
    number: "03",
    title: "Frya comeca a vender",
    copy:
      "Ela responde 24/7, qualifica com contexto e empurra o lead para a proxima acao certa.",
  },
] as const;

const capabilities = [
  {
    title: "Qualifica leads automaticamente",
    copy:
      "Pontua interesse, classifica cada conversa e separa o que esta quente do que ainda precisa nutrir.",
    detail: "Score + classificacao",
  },
  {
    title: "Faz follow-up no timing certo",
    copy:
      "Retoma contato na janela ideal e evita que o lead esfrie so porque ninguem respondeu a tempo.",
    detail: "Cadencias com contexto",
  },
  {
    title: "Responde 24/7 no WhatsApp",
    copy:
      "A Frya atende fora do horario comercial, segura a conversa viva e evita o famoso 'depois eu vejo'.",
    detail: "Atendimento sem pausa",
  },
  {
    title: "Dashboard com visao completa",
    copy:
      "Tudo cai no pipeline: score, status, proximo passo, historico e o que precisa da equipe humana.",
    detail: "Operacao visivel",
  },
] as const;

const audiences = [
  "Clinicas",
  "Consultorios",
  "Agencias",
  "Prestadores de servico",
  "E-commerce",
] as const;

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    cadence: "/mes",
    highlight: "Para testar a Frya no seu ritmo",
    cta: "Comecar gratis",
    href: "/sign-up",
    tone: "neutral" as const,
    features: [
      "1 agente SDR",
      "50 conversas por mes",
      "Dashboard basico",
      "Teste sem conectar o WhatsApp",
    ],
  },
  {
    name: "Pro",
    price: "R$ 197",
    cadence: "/mes",
    highlight: "Para colocar a operacao de vendas rodando de verdade",
    cta: "Assinar Pro",
    href: "/sign-up?plan=pro",
    tone: "accent" as const,
    features: [
      "Conversas ilimitadas",
      "Integracoes e automacoes",
      "Dashboard completo",
      "Suporte prioritario",
    ],
  },
] as const;

const faqs = [
  {
    question: "Preciso de conhecimento tecnico?",
    answer:
      "Nao. O setup foi pensado para PMEs brasileiras. Voce responde algumas perguntas, conecta o WhatsApp quando quiser e a Frya entra em operacao sem precisar de time tecnico.",
  },
  {
    question: "Funciona com meu numero atual?",
    answer:
      "Sim. A ideia e usar o numero que sua operacao ja conhece para a Frya responder e qualificar sem quebrar o fluxo comercial.",
  },
  {
    question: "E se a Frya nao souber responder?",
    answer:
      "Ela sinaliza que precisa de ajuda, registra o contexto e joga a conversa para voce assumir sem perder historico.",
  },
  {
    question: "Posso testar sem conectar o WhatsApp?",
    answer:
      "Sim. Voce pode fazer signup, concluir o onboarding e testar a Frya pelo chat do dashboard antes de ativar o canal.",
  },
  {
    question: "A Frya serve para qual tipo de negocio?",
    answer:
      "Se o seu comercial recebe mensagem no WhatsApp, a Frya faz sentido. Ela foi desenhada para empresas que dependem de resposta rapida para vender.",
  },
] as const;

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#86efac]">
      {children}
    </p>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
        {description}
      </p>
    </div>
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
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-medium transition-[transform,box-shadow,background-color,border-color,color] duration-300 hover:-translate-y-0.5 sm:min-h-14 sm:px-7 sm:text-base",
        tone === "primary"
          ? "border border-[#22c55e]/70 bg-[#22c55e] text-[#04110a] shadow-[0_16px_44px_rgba(34,197,94,0.24)] hover:bg-[#4ade80] hover:shadow-[0_20px_52px_rgba(34,197,94,0.28)]"
          : "border border-white/12 bg-white/[0.04] text-white/88 hover:border-white/22 hover:bg-white/[0.08]",
      )}
    >
      {children}
    </Link>
  );
}

function ArrowUpRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mt-0.5 h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function WhatsAppMockup() {
  return (
    <div className="animate-panel-in relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,18,0.94),rgba(8,8,8,0.98))] p-3 shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-[#22c55e]/12 blur-3xl" />
      <div className="relative rounded-[1.5rem] border border-white/8 bg-[#101010] p-3">
        <div className="flex items-center justify-between rounded-[1.25rem] bg-[#171717] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22c55e]/18 text-sm font-semibold text-[#86efac]">
              F
            </div>
            <div>
              <p className="text-sm font-medium text-white">Frya</p>
              <p className="text-xs text-white/45">online agora</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-white/45">
            <span className="frya-typing-dot h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
            <span className="frya-typing-dot h-1.5 w-1.5 rounded-full bg-[#22c55e]" style={{ animationDelay: "120ms" }} />
            <span className="frya-typing-dot h-1.5 w-1.5 rounded-full bg-[#22c55e]" style={{ animationDelay: "240ms" }} />
          </div>
        </div>

        <div className="mt-3 space-y-3 rounded-[1.4rem] bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.10),transparent_44%),linear-gradient(180deg,#111111,#0b0b0b)] p-4">
          <div className="ml-auto max-w-[78%] rounded-[1.25rem] rounded-tr-md bg-[#1b1b1b] px-4 py-3 text-sm leading-6 text-white/82">
            Oi! Quero entender se a Frya funciona para a minha clinica.
          </div>

          <div className="max-w-[84%] rounded-[1.25rem] rounded-tl-md bg-[#22c55e] px-4 py-3 text-sm leading-6 text-[#052111]">
            Funciona sim. Em menos de 2 minutos eu consigo mapear seu atendimento e ja assumir a qualificacao dos novos leads no WhatsApp.
          </div>

          <div className="max-w-[84%] rounded-[1.25rem] rounded-tl-md bg-[#22c55e] px-4 py-3 text-sm leading-6 text-[#052111]">
            Pelo que voce me contou, seu lead entrou quente e precisa de retorno rapido. Ja deixei como <strong>Hot</strong> com score 91/100 e sugeri reuniao para amanha, 15h.
          </div>

          <div className="ml-auto max-w-[70%] rounded-[1.25rem] rounded-tr-md bg-[#1b1b1b] px-4 py-3 text-sm leading-6 text-white/82">
            Perfeito. Pode agendar.
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["Score", "91/100"],
            ["Classificacao", "Hot"],
            ["Proximo passo", "Reuniao agendada"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3"
            >
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/36">
                {label}
              </p>
              <p className="mt-2 text-sm font-medium text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FryaLanding({ className }: { className?: string }) {
  return (
    <main className={cn(className, "bg-[#0a0a0a] text-white")}>
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.10),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

        <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-10 sm:px-8 sm:pb-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:px-12 lg:pb-24 lg:pt-16">
          <div className="animate-in-view space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/68">
              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
              Feita para PMEs brasileiras que vendem no WhatsApp
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-white sm:text-5xl lg:text-7xl">
                Sua vendedora AI que nunca dorme
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/64 sm:text-xl">
                A Frya qualifica leads, faz follow-up e agenda reunioes no
                WhatsApp. Automatica. 24/7.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <CTAButton href="/sign-up">Comecar gratis</CTAButton>
              <CTAButton href="#como-funciona" tone="secondary">
                Ver como funciona
              </CTAButton>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "resposta inicial",
                  value: "< 1 min",
                },
                {
                  label: "operacao",
                  value: "24/7",
                },
                {
                  label: "setup",
                  value: "2 min",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur"
                >
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-in-view lg:pl-4">
            <WhatsAppMockup />
          </div>
        </section>
      </div>

      <section
        id="como-funciona"
        className="animate-in-view mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24"
      >
        <SectionHeader
          eyebrow="Como funciona"
          title="Tres passos para colocar a Frya vendendo por voce"
          description="O fluxo foi desenhado para quem precisa sair do 'depois eu respondo' e entrar em operacao sem complicacao."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.number}
              className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#86efac]">
                  {step.number}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/48">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-white">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/58">{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="animate-in-view mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
        <SectionHeader
          eyebrow="O que a Frya faz"
          title="Tudo que trava a venda no WhatsApp passa a ter processo"
          description="A Frya assume a primeira linha comercial, organiza o contexto e deixa a equipe humana entrar na hora certa."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {capabilities.map((item) => (
            <article
              key={item.title}
              className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-[#22c55e]/24 bg-[#22c55e]/10 px-3 py-1 text-xs text-[#86efac]">
                  {item.detail}
                </span>
                <ArrowUpRight />
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-white">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/58">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="animate-in-view mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeader
            eyebrow="Pra quem e"
            title="Feita pra quem vende pelo WhatsApp"
            description="Clinicas, consultorios, agencias, prestadores de servico e e-commerce: se seus clientes te mandam mensagem no WhatsApp, a Frya e pra voce."
          />

          <div className="rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 sm:p-8">
            <div className="flex flex-wrap gap-3">
              {audiences.map((audience) => (
                <span
                  key={audience}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72"
                >
                  {audience}
                </span>
              ))}
            </div>

            <p className="mt-8 max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-3xl">
              Se seus clientes te mandam mensagem no WhatsApp, a Frya e pra voce.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
              Ela nao substitui sua equipe. Ela garante que nenhum lead fique sem
              resposta, sem contexto ou sem proximo passo.
            </p>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="animate-in-view mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24"
      >
        <SectionHeader
          eyebrow="Pricing"
          title="Comece simples e evolua quando a operacao pedir"
          description="Sem mistica, sem setup pesado. Escolha o plano para testar agora e crescer depois."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "rounded-[2.2rem] border p-6 sm:p-8",
                plan.tone === "accent"
                  ? "border-[#22c55e]/26 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
                  : "border-white/10 bg-white/[0.03]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white/72">{plan.name}</p>
                  <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                    {plan.price}
                    <span className="ml-2 text-base font-normal text-white/46">
                      {plan.cadence}
                    </span>
                  </p>
                </div>
                {plan.tone === "accent" ? (
                  <span className="rounded-full border border-[#22c55e]/22 bg-[#22c55e]/10 px-3 py-1 text-xs text-[#86efac]">
                    Mais completo
                  </span>
                ) : null}
              </div>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/58">
                {plan.highlight}
              </p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm leading-7 text-white/72"
                  >
                    <span className="text-[#86efac]">
                      <CheckIcon />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={cn(
                  "mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-medium transition-[transform,box-shadow,background-color,border-color,color] duration-300 hover:-translate-y-0.5 sm:min-h-14 sm:px-7",
                  plan.tone === "accent"
                    ? "border border-[#22c55e]/70 bg-[#22c55e] text-[#04110a] shadow-[0_16px_44px_rgba(34,197,94,0.24)] hover:bg-[#4ade80]"
                    : "border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]",
                )}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section
        id="faq"
        className="animate-in-view mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24"
      >
        <SectionHeader
          eyebrow="FAQ"
          title="Perguntas comuns antes de colocar a Frya no ar"
          description="As respostas curtas para o que mais trava a decisao de quem vende por mensagem."
        />

        <div className="mt-10 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-[1.8rem] border border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-base font-medium text-white sm:text-lg">
                  {item.question}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/46 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="animate-in-view mx-auto max-w-7xl px-6 pb-12 pt-2 sm:px-8 lg:px-12 lg:pb-16">
        <div className="rounded-[2.4rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <SectionEyebrow>Comece agora</SectionEyebrow>
              <h2 className="max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-4xl">
                Em 10 segundos da para entender. Em 2 minutos da para colocar a Frya no ar.
              </h2>
            </div>

            <CTAButton href="/sign-up">Comecar gratis</CTAButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 text-sm text-white/50 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <p>Frya by Ravit. Vendas no WhatsApp com contexto, ritmo e processo.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/termos" className="hover:text-white">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-white">
              Privacidade
            </Link>
            <Link href="/contato" className="hover:text-white">
              Contato
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
