import React from "react";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "primary";
  size?: "sm" | "md" | "lg";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { children, variant = "default", size = "md", className = "", ...props },
    ref,
  ) => {
    const sizeStyles = {
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base",
      lg: "h-12 w-12 text-lg",
    };

    const variantStyles = {
      default: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
      primary: "border-0 bg-indigo-500 text-white hover:bg-indigo-600",
    };

    return (
      <button
        ref={ref}
        className={`flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
