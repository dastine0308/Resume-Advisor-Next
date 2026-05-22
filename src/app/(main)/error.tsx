"use client";

import { useEffect } from "react";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Button } from "@/components/ui";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { reset: resetQueries } = useQueryErrorResetBoundary();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md text-center">
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          We could not load this page. Check your connection and try again.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            variant="primary"
            onClick={() => {
              resetQueries();
              reset();
            }}
          >
            Try again
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = "/dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
