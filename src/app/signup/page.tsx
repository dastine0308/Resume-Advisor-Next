"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    // Move to step 2 of signup flow
    const encoded = encodeURIComponent(form.email || "");
    router.push(`/accountCreation?email=${encoded}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="rounded-xl bg-white p-6 shadow-md">
          {/* Header */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-bold text-indigo-600">Sign Up</h1>
            <p className="mt-1 text-sm text-gray-600">Create your account to get AI-powered resume help</p>
          </div>

          {/* Step Indicator (compact mobile) */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-2 w-8 rounded-full bg-indigo-600" />
            <div className="h-2 w-8 rounded-full bg-gray-300" />
          </div>

          {/* Form */}
          <form ref={(el) => { formRef.current = el; }} onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })}
              placeholder="Create a password"
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm password"
              required
            />

            <div className="hidden sm:flex">
              <Button type="submit" variant="gradient" className="w-full py-2">Continue</Button>
            </div>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-white p-4 border-t border-gray-200">
        <div className="mx-auto max-w-md">
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm"
            >
              Back
            </button>
            <button
              onClick={() => formRef.current?.requestSubmit()}
              style={{ background: "linear-gradient(to right, #ec4899, #7c3aed)" }}
              className="flex-1 rounded-md py-3 text-sm font-semibold text-white shadow-sm"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
