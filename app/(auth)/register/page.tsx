import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 lg:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_460px]">
        <section className="space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            cadastro
          </p>
          <h1 className="max-w-2xl font-display text-5xl leading-tight text-white">
            Crie a conta da sua PME e comece a montar o time de IA.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            O fluxo abaixo serve como base para o futuro signup com Clerk,
            onboarding guiado e plano pago via Stripe.
          </p>
        </section>

        <Card className="border-white/12 bg-surface-strong/80">
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Nome da empresa" />
            <Input placeholder="voce@empresa.com.br" type="email" />
            <Input placeholder="Crie uma senha" type="password" />
            <Button className="w-full" type="button">
              Iniciar com Clerk
            </Button>
            <p className="text-sm text-muted-foreground">
              Ja possui acesso?{" "}
              <Link className="text-primary" href="/login">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
