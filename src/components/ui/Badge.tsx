import React from "react";
import clsx from "clsx";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded text-[var(--font-size-xs)] font-medium tracking-normal border capitalize",
        {
          "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/20":
            variant === "success",
          "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/20":
            variant === "warning",
          "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]/20":
            variant === "danger",
          "bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info)]/20":
            variant === "info",
          "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] border-[var(--color-border)]":
            variant === "neutral",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
