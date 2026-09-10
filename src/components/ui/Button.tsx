import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0",
        {
          // Primary
          "bg-accent text-white hover:bg-accent-hover focus:ring-accent/30 active:scale-[0.98] shadow-2xs":
            variant === "primary",
          // Secondary
          "bg-white text-text-primary border border-(--color-border) hover:bg-slate-50 focus:ring-slate-300 active:scale-[0.98] shadow-2xs":
            variant === "secondary",
          // Danger
          "bg-danger text-white hover:opacity-90 focus:ring-danger/30 active:scale-[0.98] shadow-2xs":
            variant === "danger",
          // Sizes
          "px-3 py-1.5 text-xs font-bold": size === "sm",
          "px-5 py-2.5 text-sm font-bold": size === "md",
          "px-6 py-3 text-base font-bold": size === "lg",
        },
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
      {children}
    </button>
  );
}

