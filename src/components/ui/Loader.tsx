import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export interface LoaderProps {
  label?: string;
  className?: string;
  minHeight?: string;
}

export function Loader({
  label = "Loading...",
  className,
  minHeight = "350px",
}: LoaderProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center w-full gap-[var(--space-md)] text-[var(--color-text-secondary)] py-[var(--space-xl)]",
        className
      )}
      style={{ minHeight }}
    >
      <div className="relative flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-[var(--color-accent)] animate-spin" />
      </div>
      {label && (
        <p className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-secondary)] tracking-tight">
          {label}
        </p>
      )}
    </div>
  );
}
