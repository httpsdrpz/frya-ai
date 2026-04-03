import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata: Metadata = {
  title: "Termos - Frya",
  description: "Termos de uso da Frya.",
};

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Termos"
      title="Termos de uso da Frya"
      description="Resumo inicial para quem esta avaliando ou usando a Frya no WhatsApp."
      sections={[
        {
          title: "Uso da plataforma",
          body: [
            "A Frya foi feita para apoiar operacoes comerciais que atendem leads no WhatsApp. O usuario continua responsavel pela revisao do processo, das mensagens e dos acessos conectados.",
            "Ao usar a plataforma, voce concorda em fornecer informacoes verdadeiras sobre sua empresa, produto e contexto comercial para que a configuracao da Frya reflita sua operacao real.",
          ],
        },
        {
          title: "Responsabilidades",
          body: [
            "A Frya automatiza resposta, qualificacao e follow-up, mas nao substitui o julgamento humano em temas sensiveis, negociacoes especiais ou decisoes legais e financeiras.",
            "Voce e responsavel por revisar integracoes, permissao de canais e politicas internas de atendimento antes de ativar a operacao em producao.",
          ],
        },
      ]}
    />
  );
}
