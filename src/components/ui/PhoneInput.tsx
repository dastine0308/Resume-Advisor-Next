"use client";

import React from "react";
import "react-phone-number-input/style.css";
import * as RPNInput from "react-phone-number-input";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    label?: string;
    variant?: "horizontal" | "vertical";
    onChange?: (value: RPNInput.Value) => void;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, variant = "vertical", ...props }, ref) => {
      return (
        <div
          className={cn(
            "w-full gap-1.5",
            variant === "horizontal"
              ? "grid items-center gap-y-3 md:grid-cols-[1fr_4fr] md:gap-x-6"
              : "flex flex-col",
          )}
        >
          {props.label && <Label>{props.label}</Label>}
          <RPNInput.default
            ref={ref}
            label=""
            inputComponent={InputComponent}
            smartCaret={false}
            className="w-64"
            /**
             * Handles the onChange event.
             *
             * react-phone-number-input might trigger the onChange event as undefined
             * when a valid phone number is not entered. To prevent this,
             * the value is coerced to an empty string.
             *
             * @param {E164Number | undefined} value - The entered value
             */
            onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
            {...props}
          />
        </div>
      );
    },
  );
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input {...props} ref={ref} label={undefined} /> // Ensure label is not passed
));
InputComponent.displayName = "InputComponent";

export { PhoneInput };
