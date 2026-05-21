"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

interface SaveStatusBarProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  onRetry?: () => void;
  className?: string;
}

function formatSavedAt(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function SaveStatusBar({
  status,
  lastSavedAt,
  onRetry,
  className,
}: SaveStatusBarProps) {
  if (status === "idle" && !lastSavedAt) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex min-h-5 items-center justify-end gap-2 text-xs",
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {status === "unsaved" && (
        <span className="text-amber-600">Unsaved changes</span>
      )}

      {status === "saving" && (
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
          Saving...
        </span>
      )}

      {status === "saved" && lastSavedAt && (
        <span className="text-gray-500">Saved at {formatSavedAt(lastSavedAt)}</span>
      )}

      {status === "error" && (
        <>
          <span className="text-red-600">Failed to save</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}
