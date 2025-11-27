import React from "react";
import { Button } from "./Button";

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  previewContent?: React.ReactNode;
  description?: string;
  modifiedDate?: string;
  onEdit?: () => void;
  onExport?: () => void;
  showActions?: boolean;
  variant?: "summary" | "document";
  value?: string | number;
  className?: string;
}

export const DashboardCard = React.forwardRef<
  HTMLDivElement,
  DashboardCardProps
>(
  (
    {
      title,
      subtitle,
      previewContent,
      description,
      modifiedDate,
      onEdit,
      onExport,
      showActions = true,
      variant = "document",
      value,
      className = "",
    },
    ref,
  ) => {
    if (variant === "summary") {
      return (
        <div
          ref={ref}
          className={`w-full rounded-lg border-l-4 border-l-indigo-500 bg-white shadow-sm ${className}`}
        >
          <div className="flex flex-col gap-2 px-7 py-6">
            <h3 className="text-sm font-normal uppercase tracking-wider text-gray-600">
              {title}
            </h3>
            <p className="text-3xl font-bold text-indigo-500">{value}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`isolate w-full overflow-hidden rounded-lg bg-white shadow-sm ${className}`}
      >
        {/* Preview Section */}
        <div className="relative flex h-[180px] items-center justify-center border-b border-gray-200">
          <div className="absolute inset-0 opacity-50" />{" "}
          {/* Gradient overlay */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-400">
              {previewContent || "Document Preview"}
            </p>
            {subtitle && (
              <p className="text-[10px] text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-1 p-4">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {modifiedDate && (
            <p className="text-xs text-gray-400">Modified {modifiedDate}</p>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}

          {showActions && (
            <div className="mt-2 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={onEdit}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={onExport}
              >
                Export
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  },
);

DashboardCard.displayName = "DashboardCard";
