import React from "react";
import clsx from "clsx";

export interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md my-4",
        className
      )}
    >
      <p className="text-[var(--font-size-base)] text-[var(--color-text-secondary)] font-normal">
        {message}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
