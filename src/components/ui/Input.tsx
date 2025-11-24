import React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Label";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: "horizontal" | "vertical";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, variant = "vertical", className = "", ...props }, ref) => {
    return (
      <div
        className={cn(
          "w-full gap-1.5",
          variant === "horizontal"
            ? "grid items-center gap-y-3 md:grid-cols-[1fr_4fr] md:gap-x-6"
            : "flex flex-col",
        )}
      >
        {label && <Label>{label}</Label>}
        <input
          ref={ref}
          className={cn(
            "w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-xs text-black transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
