"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic mock validation (replace with API later)
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setError("");
    signIn();
    router.push("/"); // redirect to main app
  };

  return (
    <div>
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="rounded-xl bg-white p-6 shadow-md">
          {/* Header */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-bold text-indigo-600">Log In</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back to Resume Advisor
            </p>
          </div>

          {/* Form */}
          <form
            ref={(el) => {
              formRef.current = el;
            }}
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder="********"
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="hidden sm:block">
              <Button type="submit" variant="primary" className="w-full py-2">
                Sign In
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don’t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-indigo-600 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 sm:hidden">
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
              style={{
                background: "linear-gradient(to right, #ec4899, #7c3aed)",
              }}
              className="flex-1 rounded-md py-3 text-sm font-semibold text-white shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
