import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 lg:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            login
          </p>
          <h1 className="max-w-2xl font-display text-5xl leading-tight text-white">
            Entre para acompanhar o onboarding e ativar seus agentes.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Esta tela ja esta pronta para receber o fluxo real do Clerk nas
            proximas etapas do MVP.
          </p>
        </section>

        <Card className="border-white/12 bg-surface-strong/80">
          <CardHeader>
            <CardTitle>Acessar workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="voce@empresa.com.br" type="email" />
            <Input placeholder="Sua senha" type="password" />
            <Button className="w-full" type="button">
              Continuar com Clerk
            </Button>
            <p className="text-sm text-muted-foreground">
              Ainda nao tem conta?{" "}
              <Link className="text-primary" href="/register">
                Criar acesso
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
