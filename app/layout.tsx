import type { Metadata } from "next";
import Link from "next/link";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Button } from "@/components/ui/button";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Frya.ai",
  description:
    "Plataforma SaaS para PMEs brasileiras configurarem times de agentes de IA com onboarding conversacional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ClerkProvider>
          <div className="min-h-screen">
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
                  <Show when="signed-out">
                    <SignInButton>
                      <Button type="button" variant="ghost">
                        Entrar
                      </Button>
                    </SignInButton>
                    <SignUpButton>
                      <Button type="button">Comecar gratis</Button>
                    </SignUpButton>
                  </Show>
                  <Show when="signed-in">
                    <Link
                      href="/dashboard"
                      className="hidden rounded-full border border-white/12 px-4 py-2 text-sm text-white transition hover:bg-white/6 sm:inline-flex"
                    >
                      Abrir dashboard
                    </Link>
                    <UserButton />
                  </Show>
                </div>
              </div>
            </header>

            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
