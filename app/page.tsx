import Link from "next/link";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,129,57,0.22),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(24,167,135,0.16),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_24%)]" />
      <div className="absolute inset-y-0 right-[12%] hidden w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.18),transparent)] lg:block" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-white/12 bg-white/6 px-5 py-3 backdrop-blur">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              Frya.ai
            </p>
            <p className="text-sm text-muted-foreground">
              Time de IA para PMEs brasileiras
            </p>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-full border border-white/12 px-4 py-2 text-muted-foreground transition hover:border-primary/40 hover:text-white"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Começar grátis
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 gap-14 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
              onboarding conversacional para operacao real
            </div>

            <div className="space-y-5">
              <h1 className="max-w-5xl font-display text-5xl leading-[0.92] tracking-tight text-balance text-white md:text-7xl">
                Seu time de IA, configurado em 10 minutos
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-muted-foreground">
                Descreve sua operação. A Frya monta os agentes certos pra você.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Começar grátis
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-full border border-white/14 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-primary/30 hover:bg-white/6"
              >
                Ver onboarding
              </Link>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                prova social
              </p>
              <p className="mt-3 text-lg text-white">
                Já usado por X empresas brasileiras
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "SDR que não para",
                  copy: "Qualifica, responde e faz follow-up sem deixar lead esfriar.",
                },
                {
                  title: "Atendimento 24/7",
                  copy: "Mantem a experiencia do cliente ativa mesmo fora do horario comercial.",
                },
                {
                  title: "Relatórios automáticos",
                  copy: "Resume conversas, gargalos e performance sem planilha manual.",
                },
              ].map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-[1.7rem] border border-white/10 bg-white/6 p-5 backdrop-blur"
                  style={{
                    animationDelay: `${index * 80}ms`,
                  }}
                >
                  <p className="font-display text-2xl leading-tight text-white">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-12 hidden h-24 w-24 rounded-full bg-primary/20 blur-3xl lg:block" />
            <div className="absolute -right-8 bottom-8 hidden h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl lg:block" />

            <div className="rounded-[2.4rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.34)]">
              <div className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                    frya cockpit
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Plano operacional gerado em tempo real
                  </p>
                </div>
                <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  ao vivo
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="rounded-[1.8rem] border border-white/10 bg-surface p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    empresa
                  </p>
                  <p className="mt-3 font-display text-3xl text-white">
                    Clinica Aurora
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Operacao comercial em WhatsApp e Instagram, equipe enxuta e
                    necessidade de responder mais rapido sem perder contexto.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: "Agentes sugeridos",
                      value: "3 ativados",
                      copy: "SDR, atendimento e financeiro montados para a rotina da PME.",
                    },
                    {
                      label: "Tempo de setup",
                      value: "10 min",
                      copy: "Da primeira mensagem ate a definicao do time ideal.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-3 font-display text-3xl text-white">
                        {item.value}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.copy}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.8rem] border border-primary/20 bg-primary/10 p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                    o que a frya faz por voce
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-white/92">
                    <li>• Entende a operacao sem exigir configuracao tecnica.</li>
                    <li>• Define quais agentes entram primeiro e por qual motivo.</li>
                    <li>• Entrega um dashboard pronto para acompanhar o time de IA.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
