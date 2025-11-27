"use client";

import * as React from "react";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";

import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";

const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleShowPassword,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  placeholder: string;
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <div className="relative mt-1">
      <Input
        id={id}
        name="password"
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggleShowPassword}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>
    </div>
  </div>
);
export { PasswordInput };
