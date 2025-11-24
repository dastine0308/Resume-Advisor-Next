"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { z } from "zod";
import { useSignupStore } from "@/stores/useSignupStore";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function SignUpForm() {
  const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character");

  const {
    signupForm: form,
    setSignupForm: setForm,
    setCurrentStep,
  } = useSignupStore();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    // Validate password format with zod
    try {
      passwordSchema.parse(form.password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? "Invalid password");
      } else {
        setError("Invalid password");
      }
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setCurrentStep(2);
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-indigo-600">Sign Up</h1>
      </div>

      {/* Form */}
      <form
        ref={(el) => {
          formRef.current = el;
        }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, email: e.target.value })
          }
          placeholder="you@example.com"
          required
        />

        <PasswordInput
          id="password"
          label="Password"
          value={form.password}
          onChange={(value: string) => setForm({ ...form, password: value })}
          showPassword={showPassword}
          onToggleShowPassword={() => setShowPassword(!showPassword)}
          placeholder="Create a password"
        />
        <p className="text-xs text-gray-500">
          Password must be at least 8 characters and include an uppercase
          letter, lowercase letter, number, and special character.
        </p>

        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          value={form?.confirmPassword ?? ""}
          onChange={(value: string) =>
            setForm({ ...form, confirmPassword: value })
          }
          showPassword={showConfirmPassword}
          onToggleShowPassword={() =>
            setShowConfirmPassword(!showConfirmPassword)
          }
          placeholder="Confirm password"
        />

        <div className="">
          <Button type="submit" variant="primary" className="w-full py-2">
            Next
          </Button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
