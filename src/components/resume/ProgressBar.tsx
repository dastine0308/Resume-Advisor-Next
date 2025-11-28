import { Button } from "@/components/ui";
import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: {
    label: string;
    backButton?: {
      label: string;
      isDisabled?: boolean;
    };
    nextButton?: {
      label: string;
      isDisabled?: boolean;
    };
  }[];
  className?: string;
  onBack?: () => void;
  onNext?: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  steps,
  className,
  onBack,
  onNext,
}) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className={cn("w-full bg-white px-4 pb-4 pt-4 md:px-5", className)}>
      <div className="mb-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          {steps[currentStep - 1]?.label}
        </p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {(steps?.some((step) => step.backButton) ||
        steps?.some((step) => step.nextButton)) && (
        <div className="mt-4 flex justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={!onBack || steps[currentStep - 1]?.backButton?.isDisabled}
          >
            {steps[currentStep - 1]?.backButton?.label}
          </Button>
          <Button
            onClick={onNext}
            disabled={!onNext || steps[currentStep - 1]?.nextButton?.isDisabled}
            className="rounded bg-indigo-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {steps[currentStep - 1]?.nextButton?.label}
          </Button>
        </div>
      )}
    </div>
  );
};
