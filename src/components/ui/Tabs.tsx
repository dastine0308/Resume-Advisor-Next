import React from "react";

interface TabProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ label, active = false, onClick, className = "" }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`px-5 py-3 text-sm font-medium transition-colors relative
          ${active ? "text-indigo-500 border-b-2 border-indigo-500" : "text-gray-600 hover:text-gray-800"}
          ${className}`}
      >
        {label}
      </button>
    );
  }
);

Tab.displayName = "Tab";

interface TabsProps {
  items: { label: string; active?: boolean; onClick?: () => void }[];
  className?: string;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ items, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center border-b border-gray-200 overflow-x-auto ${className}`}
      >
        {items.map((item, index) => (
          <Tab key={index} {...item} />
        ))}
      </div>
    );
  }
);

Tabs.displayName = "Tabs";