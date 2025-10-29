import React from "react";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  size?: "sm" | "md";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = "md", className = "", ...props }, ref) => {
    const sizeStyles = {
      sm: "h-6 w-6 text-xs",
      md: "h-7 w-7 text-sm",
    };

    return (
      <button
        ref={ref}
        className={`flex items-center justify-center rounded border border-gray-300 bg-white transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
