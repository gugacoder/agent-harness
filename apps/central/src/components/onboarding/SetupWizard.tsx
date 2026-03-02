import { useState, useRef } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { WizardProgress } from "./WizardProgress";
import { WelcomeStep } from "./steps/WelcomeStep";
import { CompanyDataStep } from "./steps/CompanyDataStep";
import { PricingStep } from "./steps/PricingStep";
import { TeamInviteStep } from "./steps/TeamInviteStep";
import { CompletedStep } from "./steps/CompletedStep";

const STEPS = ["welcome", "company_data", "pricing", "team_invite", "completed"] as const;
const SKIPPABLE_STEPS = new Set(["pricing", "team_invite"]);

interface SetupWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const { completedSteps, completeStep } = useOnboarding("wizard");
  const [activeIndex, setActiveIndex] = useState(() => {
    const firstPending = STEPS.findIndex((s) => !completedSteps.includes(s));
    return firstPending >= 0 ? firstPending : 0;
  });
  const [direction, setDirection] = useState<"left" | "right">("left");
  const containerRef = useRef<HTMLDivElement>(null);

  const activeStepKey = STEPS[activeIndex];

  const goToStep = (index: number) => {
    setDirection(index > activeIndex ? "left" : "right");
    setActiveIndex(index);
  };

  const handleStepComplete = async (metadata?: Record<string, unknown>) => {
    await completeStep(activeStepKey, metadata);

    if (activeIndex === STEPS.length - 1) {
      // Last step — wizard done
      onComplete();
    } else {
      goToStep(activeIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (activeIndex > 0) {
      goToStep(activeIndex - 1);
    }
  };

  const handleSkip = () => {
    if (SKIPPABLE_STEPS.has(activeStepKey)) {
      handleStepComplete({ skipped: true });
    }
  };

  // Build completed step indices for WizardProgress
  const completedIndices = STEPS
    .map((s, i) => (completedSteps.includes(s) ? i : -1))
    .filter((i) => i >= 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-[fade-in_200ms_ease-out]">
      <div className="w-full max-w-2xl rounded-xl bg-card shadow-xl">
        {/* Stepper */}
        <div className="border-b border-border px-6 py-4">
          <WizardProgress
            currentStep={activeIndex}
            totalSteps={STEPS.length}
            completedSteps={completedIndices}
          />
        </div>

        {/* Step content with slide transition */}
        <div ref={containerRef} className="relative overflow-hidden">
          <div
            key={activeIndex}
            className={`transition-transform duration-200 ease-out ${
              direction === "left"
                ? "animate-[slide-in-left_200ms_ease-out]"
                : "animate-[slide-in-right_200ms_ease-out]"
            }`}
          >
            {activeStepKey === "welcome" && (
              <WelcomeStep onNext={() => handleStepComplete()} />
            )}
            {activeStepKey === "company_data" && (
              <CompanyDataStep onComplete={handleStepComplete} />
            )}
            {activeStepKey === "pricing" && (
              <PricingStep onComplete={handleStepComplete} />
            )}
            {activeStepKey === "team_invite" && (
              <TeamInviteStep onComplete={handleStepComplete} />
            )}
            {activeStepKey === "completed" && (
              <CompletedStep
                completedSteps={completedSteps}
                onComplete={async () => {
                  await completeStep("completed");
                  onComplete();
                }}
              />
            )}
          </div>
        </div>

        {/* Footer navigation — hidden on welcome (has its own button) and completed */}
        {activeStepKey !== "welcome" && activeStepKey !== "completed" && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={activeIndex === 0}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            <div className="flex gap-2">
              {SKIPPABLE_STEPS.has(activeStepKey) && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pular
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
