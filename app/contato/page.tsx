import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contato - Frya",
  description: "Fale com a equipe da Frya.",
};

export default function ContactPage() {
  return (
    <main className="bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-4xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="space-y-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#86efac]">
            Contato
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            Fale com a equipe da Frya
          </h1>
          <p className="max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
            Se voce quer tirar duvidas, entender o plano Pro ou conversar sobre
            implementacao, este e o canal.
          </p>
        </div>

        <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm leading-7 text-white/62">
            Email:
            {" "}
            <a
              href="mailto:contato@ravit.com.br"
              className="text-[#86efac] hover:text-white"
            >
              contato@ravit.com.br
            </a>
          </p>
          <p className="mt-3 text-sm leading-7 text-white/62">
            Resposta inicial em horario comercial, com prioridade para quem ja
            esta avaliando a Frya para operacao real.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-4 text-sm text-white/52">
          <Link href="/" className="hover:text-white">
            Voltar para a home
          </Link>
          <Link href="/sign-up" className="hover:text-white">
            Comecar gratis
          </Link>
        </div>
      </div>
    </main>
  );
}
