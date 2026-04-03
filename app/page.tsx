import type { Metadata } from "next";
import { FryaLanding } from "@/components/marketing/FryaLanding";

export const metadata: Metadata = {
  title: "Frya - Sua vendedora AI no WhatsApp",
  description:
    "Qualifique leads, faca follow-up e venda mais no WhatsApp com inteligencia artificial. Automatica. 24/7.",
  openGraph: {
    title: "Frya - Sua vendedora AI no WhatsApp",
    description: "Qualifique leads e venda mais no WhatsApp com IA.",
    url: "https://frya-ai.vercel.app",
    siteName: "Frya",
    type: "website",
  },
};

export default function Home() {
  return <FryaLanding />;
}
