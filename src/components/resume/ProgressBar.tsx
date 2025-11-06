import React from "react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  label,
}) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full border-b border-gray-200 bg-white px-4 pb-4 pt-4 md:px-5">
      <div className="mb-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
