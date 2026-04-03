import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOnboardingStateByUserId } from "@/lib/onboarding-setup";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    const onboardingState = await getOnboardingStateByUserId(userId);
    redirect(onboardingState.redirectTo);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-81px)] max-w-6xl items-center justify-center px-6 py-10 lg:px-10">
      <SignUp
        forceRedirectUrl="/onboarding"
        fallbackRedirectUrl="/onboarding"
        signInFallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
