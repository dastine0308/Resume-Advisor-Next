import React from "react";

interface NavigationProps {
  onBack?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onBack }) => {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 md:px-5">
      <div className="flex items-center">
        <span className="text-base font-bold text-indigo-500 md:text-lg">
          📋 Resume Advisor
        </span>
      </div>
      <button
        onClick={onBack}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:px-4 md:text-sm"
      >
        ← Back
      </button>
    </div>
  );
};
