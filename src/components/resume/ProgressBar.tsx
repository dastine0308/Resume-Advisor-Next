import { Button } from "@/components/ui";
import React from "react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: {
    label: string;
    backButtonLabel?: string;
    nextButtonLabel?: string;
  }[];
  onBack?: () => void;
  onNext?: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  steps,
  onBack,
  onNext,
}) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-white px-4 pb-4 pt-4 md:px-5">
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
      {(steps?.some((step) => step.backButtonLabel) ||
        steps?.some((step) => step.nextButtonLabel)) && (
        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={!onBack}>
            {steps[currentStep - 1]?.backButtonLabel}
          </Button>
          <Button
            onClick={onNext}
            disabled={!onNext}
            className="rounded bg-indigo-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {steps[currentStep - 1]?.nextButtonLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
