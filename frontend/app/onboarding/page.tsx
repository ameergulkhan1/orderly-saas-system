"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Step1Business } from "@/components/onboarding/Step1Business";
import { Step2Product } from "@/components/onboarding/Step2Product";
import { Step3Customer } from "@/components/onboarding/Step3Customer";
import { Step4Ready } from "@/components/onboarding/Step4Ready";
import { isAuthenticated } from "@/lib/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const totalSteps = 4;

  useEffect(() => {
    const authenticated = isAuthenticated();

    if (authenticated) {
      setAuthChecked(true);
      setIsLoading(false);
    } else {
      router.replace("/register");
    }
  }, [router]);

  const handleStepComplete = (data: any) => {
    setOnboardingData((prev: any) => ({ ...prev, ...data }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    // Persist locally for the session; server already has the user via auth tokens.
    try {
      localStorage.setItem("onboardingData", JSON.stringify(onboardingData));
      localStorage.setItem("onboardingComplete", "true");
    } catch {
      // ignore storage errors
    }
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return null;
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={() => {}}
      onBack={handleBack}
      onComplete={handleComplete}
      isLastStep={currentStep === totalSteps - 1}
    >
      {currentStep === 0 && (
        <Step1Business onNext={handleStepComplete} initialData={onboardingData} />
      )}
      {currentStep === 1 && (
        <Step2Product
          onNext={handleStepComplete}
          onBack={handleBack}
          initialData={onboardingData}
        />
      )}
      {currentStep === 2 && (
        <Step3Customer
          onNext={handleStepComplete}
          onBack={handleBack}
          initialData={onboardingData}
        />
      )}
      {currentStep === 3 && (
        <Step4Ready onComplete={handleComplete} data={onboardingData} />
      )}
    </OnboardingLayout>
  );
}