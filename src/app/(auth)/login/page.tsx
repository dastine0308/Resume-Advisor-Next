"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { login, getUserData } from "@/lib/api-services";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAccountStore } from "@/stores/useAccountStore";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { setUser } = useAccountStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await login({ email, password });

      if (result.success && result.token) {
        // Store token in cookie
        setAuth(result.token, result.user_id);
        // Fetch and store user data
        const userData = await getUserData();
        setUser(userData);
        router.push("/");
      } else {
        setError("Invalid email or password");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 lg:w-[500px]">
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

          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={(value: string) => setPassword(value)}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            placeholder="Create a password"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
