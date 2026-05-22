"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FileTextIcon, MagicWandIcon } from "@radix-ui/react-icons";
import brandIcon from "@/app/icon.png";
import { supabase } from "@/lib/supabase/client";

const FEATURES = [
  {
    icon: MagicWandIcon,
    label: "AI-powered resume tailoring for every job",
  },
  {
    icon: FileTextIcon,
    label: "Clean, ATS-friendly LaTeX output",
  },
] as const;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      <Link
        href="/"
        aria-label="Back to Resume Advisor home"
        className="mb-8 flex flex-col items-center gap-3 transition-opacity hover:opacity-80"
      >
        <Image
          src={brandIcon}
          alt="Resume Advisor"
          width={56}
          height={56}
          priority
          className="h-14 w-14"
        />
      </Link>

      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg shadow-indigo-100/50">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to Resume Advisor
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to continue building your professional resume
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>

        <ul className="mt-8 space-y-3 border-t border-gray-100 pt-6">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-start gap-3 text-sm text-gray-600"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                <Icon width={14} height={14} aria-hidden />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link
          href="/"
          className="font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}
