import { Label } from "@/components/ui/Label";
import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && <Label>{label}</Label>}
        <textarea
          ref={ref}
          className={`min-h-[80px] w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-xs text-black transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 md:text-sm ${className}`}
          {...props}
        />
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
