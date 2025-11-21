"use client";

import Link from "next/link";
import { useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { z } from "zod";
import { useSignupStore } from "@/stores/useSignupStore";

export default function SignUpPage() {
  const EyeOnIcon = EyeOpenIcon;
  const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character");

  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
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
    // Save form to zustand and move to profile setup
    useSignupStore.getState().setSignupForm(form);
    router.push(`/signup/profile-setup`);
    useSignupStore.getState().setCurrentStep(2);
  };

  return (
    <div className="mx-auto px-4 py-6">
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

          <div>
            <label className="text-xs font-bold text-gray-800 md:text-sm">
              Password
            </label>
            <div className="relative mt-1">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Create a password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOnIcon /> : <EyeClosedIcon />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 8 characters and include an uppercase
              letter, lowercase letter, number, and special character.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-800 md:text-sm">
              Confirm Password
            </label>
            <div className="relative mt-1">
              <Input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                placeholder="Confirm password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOnIcon /> : <EyeClosedIcon />}
              </button>
            </div>
          </div>

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
    </div>
  );
}
