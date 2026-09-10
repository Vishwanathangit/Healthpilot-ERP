import React from "react";
import clsx from "clsx";

export interface TableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}

export function Table({ headers, children, className }: TableProps) {
  return (
    <div className={clsx("w-full overflow-x-auto border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] shadow-2xs", className)}>
      <table className="w-full text-left border-collapse text-[var(--font-size-base)]">
        <thead>
          <tr className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold text-[var(--font-size-xs)]">
            {headers.map((header, idx) => (
              <th key={idx} className="px-[var(--space-md)] py-[var(--space-md)] font-semibold text-slate-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        "hover:bg-[var(--color-surface-subtle)]/60 transition-colors border-b border-[var(--color-border-subtle)] last:border-b-0",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={clsx("px-[var(--space-md)] py-[var(--space-md)] text-left align-middle text-[var(--font-size-sm)]", className)}>
      {children}
    </td>
  );
}
