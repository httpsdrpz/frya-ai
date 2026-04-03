import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { validateOnboardingSetupData } from "@/lib/onboarding-flow";
import { persistOnboardingSetup } from "@/lib/onboarding-setup";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "Nao autenticado.",
      },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Payload invalido.",
      },
      { status: 400 },
    );
  }

  const validation = validateOnboardingSetupData(payload);

  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Revise os campos obrigatorios.",
        fieldErrors: validation.errors,
      },
      { status: 400 },
    );
  }

  try {
    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress ??
      `${userId}@frya.local`;
    const name =
      user?.fullName ??
      user?.firstName ??
      user?.emailAddresses[0]?.emailAddress ??
      null;

    await persistOnboardingSetup({
      userId,
      email,
      name,
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    console.error("Erro ao concluir onboarding:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Nao foi possivel concluir o onboarding agora.",
      },
      { status: 500 },
    );
  }
}
