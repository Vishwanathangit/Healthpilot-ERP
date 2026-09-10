import React from "react";
import clsx from "clsx";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({ children, className, header, footer, noPadding = false }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-surface border border-(--color-border) rounded-md shadow-xs",
        className?.includes("overflow-") ? "" : "overflow-hidden",
        className
      )}
    >
      {header && (
        <div className="px-5 py-4 border-b border-(--color-border) bg-surface-subtle font-medium text-text-primary">
          {header}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-(--color-border) bg-surface-subtle">
          {footer}
        </div>
      )}
    </div>
  );
}
