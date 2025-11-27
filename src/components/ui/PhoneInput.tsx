"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> & {
  label?: string;
  variant?: "horizontal" | "vertical";
  value?: string;
  onChange?: (value: string) => void;
};

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export const isValidPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10;
};

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<HTMLInputElement, PhoneInputProps>(
    (
      { className, onChange, variant = "vertical", value = "", ...props },
      ref,
    ) => {
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const digits = rawValue.replace(/\D/g, "").slice(0, 10);
        const formatted = formatPhoneNumber(digits);
        onChange?.(formatted);
      };

      return (
        <Input
          ref={ref}
          type="tel"
          value={value}
          onChange={handleChange}
          variant={variant}
          placeholder="(123) 456-7890"
          className={cn("w-full", className)}
          maxLength={14}
          label={undefined}
          {...props}
        />
      );
    },
  );
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
