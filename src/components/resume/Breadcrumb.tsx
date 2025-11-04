import React from "react";

interface BreadcrumbItem {
  label: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <div className="flex items-center gap-3 bg-white px-4 py-4 md:px-5">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <button
            className={`text-[12px] transition-colors md:text-sm ${
              item.active
                ? "font-medium text-gray-800"
                : "font-medium text-indigo-600 hover:text-indigo-700"
            }`}
          >
            {item.label}
          </button>
          {index < items.length - 1 && (
            <span className="text-sm text-gray-300">/</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
