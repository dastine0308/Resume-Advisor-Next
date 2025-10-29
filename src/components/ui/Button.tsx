import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "gradient";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className = "", children, ...props },
    ref,
  ) => {
    const baseStyles =
      "rounded font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantStyles = {
      primary:
        "bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-500",
      secondary:
        "bg-white border border-indigo-500 text-indigo-500 hover:bg-gray-50 focus:ring-gray-500",
      outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
      gradient:
        "bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs md:text-sm",
      md: "px-4 py-2 text-sm md:text-sm",
      lg: "px-6 py-3 text-base md:text-lg",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
