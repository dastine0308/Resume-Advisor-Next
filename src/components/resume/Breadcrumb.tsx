import React from "react";
import { ChevronRightIcon } from "@radix-ui/react-icons";

interface BreadcrumbItem {
  id?: string;
  label: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onSelect?: (id?: string) => void;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  onSelect,
  className = "",
}) => {
  return (
    <div
      className={
        "flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-4 md:px-5 " +
        className
      }
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <button
            type="button"
            onClick={() => onSelect?.(item.id)}
            aria-current={item.active ? "true" : undefined}
            className={`md:text-md text-sm transition-colors ${
              item.active
                ? "font-medium text-gray-800"
                : "font-medium text-indigo-600 hover:text-indigo-700"
            }`}
          >
            {item.label}
          </button>
          {index < items.length - 1 && (
            <span className="text-sm text-gray-300">
              <ChevronRightIcon />
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
