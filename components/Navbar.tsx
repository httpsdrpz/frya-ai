import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export async function Navbar() {
  const { userId } = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="space-y-1">
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-primary">
              Frya.ai
            </p>
            <p className="font-display text-lg text-white">
              Seu time de IA em 10 minutos
            </p>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {userId ? (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-full border border-white/12 px-4 py-2 text-sm text-white transition hover:bg-white/6 sm:inline-flex"
              >
                Abrir dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex h-11 items-center justify-center rounded-full bg-transparent px-4 py-2 font-medium text-muted-foreground shadow-sm transition hover:bg-white/6 hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Comecar gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
