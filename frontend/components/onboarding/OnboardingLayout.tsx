"use client";

import { Check, Building2, Package, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  isLastStep: boolean;
}

const steps = [
  { icon: Building2, label: "Business" },
  { icon: Package, label: "Products" },
  { icon: Users, label: "Customer" },
  { icon: Sparkles, label: "Ready" },
];

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onComplete,
  isLastStep,
}: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div key={index} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isActive
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200"
                            : "bg-gray-200 text-gray-500"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-2 text-xs font-medium",
                          isActive ? "text-gray-900" : "text-gray-500"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "mx-2 h-0.5 flex-1",
                          index < currentStep ? "bg-green-500" : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="rounded-2xl border bg-white p-8 shadow-xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Let's set up your store
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>

            {children}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <button
                onClick={onBack}
                className={cn(
                  "text-sm font-medium transition-colors",
                  currentStep === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:text-gray-900"
                )}
                disabled={currentStep === 0}
              >
                Back
              </button>

              {isLastStep ? (
                <button
                  onClick={onComplete}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-medium text-white transition-all hover:shadow-lg"
                >
                  Go to Dashboard →
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-medium text-white transition-all hover:shadow-lg"
                >
                  Next Step →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}