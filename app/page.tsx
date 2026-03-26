import { Inter } from "next/font/google";
import { FryaLanding } from "@/components/marketing/FryaLanding";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function Home() {
  return <FryaLanding className={inter.className} />;
}
