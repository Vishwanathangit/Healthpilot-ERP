import React from "react";
import clsx from "clsx";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-(--color-border)",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        {description && (
          <p className="text-xs sm:text-sm font-medium text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-(--space-sm) shrink-0 mr-2 sm:mr-4">{action}</div>}
    </div>
  );
}
