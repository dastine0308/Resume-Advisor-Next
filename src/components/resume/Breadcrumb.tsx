import React from "react";

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
            className={`text-[11px] transition-colors md:text-xs ${
              item.active
                ? "font-normal text-gray-800"
                : "font-normal text-indigo-500 hover:text-indigo-600"
            }`}
          >
            {item.label}
          </button>
          {index < items.length - 1 && (
            <span className="text-[10.5px] text-gray-400">/</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
