import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label className="text-xs font-bold text-gray-800 md:text-sm">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-xs text-black transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 md:text-sm ${className}`}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
