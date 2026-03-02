import { Check } from "lucide-react";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
}

export function WizardProgress({
  currentStep,
  totalSteps,
  completedSteps,
}: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = completedSteps.includes(i);
        const isActive = i === currentStep;

        return (
          <div key={i} className="flex items-center">
            {/* Circle */}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
            </div>

            {/* Connector line */}
            {i < totalSteps - 1 && (
              <div
                className={`h-0.5 w-8 ${
                  isCompleted ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
