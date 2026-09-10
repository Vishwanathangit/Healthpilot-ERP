"use client";

import React from "react";
import { usePathname } from "next/navigation";

const PATH_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/requisitions": "Stock Requisitions",
  "/purchase-orders": "Purchase Orders",
  "/goods-receipts": "Goods Receipts (GRN)",
  "/invoices": "Invoices & 3-Way Matching",
  "/stock-transfers": "Stock Transfers",
  "/sales": "Pharmacy Sales & Dispensing",
  "/stock-ledger": "Stock Ledger & Positions",
  "/traceability": "Pharmaceutical Traceability & Audit Trail",
};

export function TopbarTitle() {
  const pathname = usePathname();
  const title = PATH_TITLES[pathname] || "HealthPilot ERP";

  return (
    <div className="flex items-center gap-2.5">
      <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] inline-block shrink-0"></span>
      <h1 className="text-lg font-bold text-slate-900 tracking-tight">
        {title}
      </h1>
    </div>
  );
}
