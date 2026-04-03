import Link from "next/link";

interface PublicInfoPageProps {
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{
    title: string;
    body: string[];
  }>;
}

export function PublicInfoPage({
  eyebrow,
  title,
  description,
  sections,
}: PublicInfoPageProps) {
  return (
    <main className="bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-4xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="space-y-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#86efac]">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
            {description}
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6"
            >
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-white/62">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

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
