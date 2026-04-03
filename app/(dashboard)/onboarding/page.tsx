import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SalesOnboardingFlow } from "@/components/onboarding/SalesOnboardingFlow";
import {
  getOnboardingInitialValues,
  getOnboardingStateByUserId,
} from "@/lib/onboarding-setup";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const onboardingState = await getOnboardingStateByUserId(userId);

  if (onboardingState.completed) {
    redirect("/dashboard");
  }

  return (
    <SalesOnboardingFlow
      initialValues={getOnboardingInitialValues(onboardingState.company)}
    />
  );
}
