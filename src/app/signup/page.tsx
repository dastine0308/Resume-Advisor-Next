"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-blue-600 md:text-3xl"> 
            Sign Up
          </h1>
          <p className="mt-2 text-gray-600">
            Create your account to get AI-powered resume help
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center space-x-4">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-blue-600">Sign Up</span>
            <div className="mt-1 h-1.5 w-12 rounded-full bg-blue-600" />
          </div>
          <div className="h-0.5 w-10 bg-gray-300" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-gray-400">Profile Setup</span>
            <div className="mt-1 h-1.5 w-12 rounded-full bg-gray-300" />
          </div>
        </div>

  {/* Form */}
  <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="********"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-pink-500 to-indigo-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Continue to profile setup
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
