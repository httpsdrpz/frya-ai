import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingQuiz } from "@/components/onboarding/OnboardingQuiz";
import {
  getOnboardingStateByUserId,
} from "@/lib/onboarding-setup";
import { getOnboardingQuizInitialValues } from "@/lib/onboarding-quiz-server";

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
    <OnboardingQuiz
      initialValues={getOnboardingQuizInitialValues(onboardingState.company)}
    />
  );
}
