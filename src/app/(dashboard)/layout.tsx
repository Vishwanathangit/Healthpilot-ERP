import React from "react";
import Link from "next/link";
import { ActiveEmployeeSelector } from "@/components/ActiveEmployeeSelector";
import { Activity, Pill, PackageCheck, Truck, Receipt, ArrowLeftRight, ShoppingBag, History } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Shell */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Pill className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">HealthPilot ERP</h1>
                <span className="bg-sky-500/10 text-sky-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-sky-500/20">
                  Pharmacy Chain
                </span>
              </div>
              <p className="text-xs text-slate-400">Insulin Glargine 100 IU/ml Supply Chain</p>
            </div>
          </div>

          {/* Active Employee Selector Placeholder */}
          <ActiveEmployeeSelector />
        </div>

        {/* Secondary Sub-Nav Bar for ERP Sections */}
        <nav className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto scrollbar-none text-xs font-medium">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Activity className="w-4 h-4 text-sky-400" />
            Overview
          </Link>
          <Link
            href="/requisitions"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            Stock Requisitions
          </Link>
          <Link
            href="/purchase-orders"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Truck className="w-4 h-4 text-blue-400" />
            Purchase Orders
          </Link>
          <Link
            href="/goods-receipts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Receipt className="w-4 h-4 text-purple-400" />
            Goods Receipts
          </Link>
          <Link
            href="/invoices"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            Invoice Matching
          </Link>
          <Link
            href="/stock-transfers"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            Stock Transfers
          </Link>
          <Link
            href="/dispensing"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ShoppingBag className="w-4 h-4 text-rose-400" />
            Dispensing / Sales
          </Link>
          <Link
            href="/stock-ledger"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <History className="w-4 h-4 text-teal-400" />
            Stock Ledger & Audit
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
