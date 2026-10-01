"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Step1Business } from "@/components/onboarding/Step1Business";
import { Step2Product } from "@/components/onboarding/Step2Product";
import { Step3Customer } from "@/components/onboarding/Step3Customer";
import { Step4Ready } from "@/components/onboarding/Step4Ready";
import { isAuthenticated } from "@/lib/auth";
import { onboardingAPI, type BusinessCategory } from "@/lib/api/onboarding.api";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 4;

  useEffect(() => {
    if (isAuthenticated()) {
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

  const handleComplete = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        business: {
          businessName: onboardingData.businessName,
          category: (onboardingData.category as BusinessCategory) ?? "other",
        },
        ...(onboardingData.productName && onboardingData.price
          ? {
              product: {
                name: onboardingData.productName,
                price: Number(onboardingData.price),
                stock: Number(onboardingData.stock ?? 0),
              },
            }
          : {}),
        ...(onboardingData.customerName && onboardingData.phone
          ? {
              customer: {
                name: onboardingData.customerName,
                phone: onboardingData.phone,
                address: onboardingData.address || undefined,
              },
            }
          : {}),
      };

      const res = await onboardingAPI.complete(payload);

      if (!res.success) {
        setError(res.error?.message || "Failed to complete onboarding");
        return;
      }

      // Optional: still write a local flag so any frontend guard can read it
      try {
        localStorage.setItem("onboardingComplete", "true");
      } catch {}

      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.error?.message ||
          err?.message ||
          "Failed to complete onboarding"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authChecked) return null;

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={() => {}}
      onBack={handleBack}
      onComplete={handleComplete}
      isLastStep={currentStep === totalSteps - 1}
    >
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {submitting && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Saving your store...
        </div>
      )}

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