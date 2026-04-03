import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata: Metadata = {
  title: "Privacidade - Frya",
  description: "Politica de privacidade da Frya.",
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Privacidade"
      title="Politica de privacidade"
      description="Como tratamos os dados usados para operar a Frya com seguranca e contexto."
      sections={[
        {
          title: "Dados utilizados",
          body: [
            "A Frya utiliza dados informados no onboarding, mensagens de atendimento e dados operacionais necessarios para classificar leads, sugerir proximos passos e exibir o pipeline.",
            "Sempre que possivel, o objetivo e coletar apenas o necessario para a operacao comercial funcionar com contexto.",
          ],
        },
        {
          title: "Controle e acesso",
          body: [
            "O acesso ao workspace e protegido por autenticacao. Cabe ao cliente controlar quem pode visualizar o dashboard, as conversas e os dados da empresa.",
            "Se voce precisar atualizar ou remover informacoes, o caminho recomendado e entrar em contato pelo canal oficial informado na pagina de contato.",
          ],
        },
      ]}
    />
  );
}
