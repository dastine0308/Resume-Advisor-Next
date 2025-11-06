"use client";

import Link from "next/link";

export default function SignInRequired() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md rounded-xl bg-white p-10 text-center shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-blue-700">
          Account Required
        </h1>
        <p className="mb-6 text-gray-600">
          Sign in to start using Resume Advisor.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition-all hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-blue-600 px-5 py-2 font-semibold text-blue-600 transition-all hover:bg-blue-50"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
