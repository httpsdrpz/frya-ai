import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FryaLanding } from "@/components/marketing/FryaLanding";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return <FryaLanding />;
}
