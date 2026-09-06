import React from "react";
import { checkDbConnection } from "@/db";
import { PRODUCT_DETAILS } from "@/lib/constants";
import { Database, Pill, ShieldCheck, Building, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const dbStatus = await checkDbConnection();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Setup Step Complete
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Hospital Supply Chain & ERP Management
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Central Pharmacy Warehouse • Branch Pharmacies A, B, C • Central Purchasing • Supplier
            </p>
          </div>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tracked Product Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tracked Product</span>
            <Pill className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{PRODUCT_DETAILS.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">SKU: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-mono">{PRODUCT_DETAILS.sku}</code> | Unit: {PRODUCT_DETAILS.unit}</p>
          </div>
        </div>

        {/* Database Connection Status Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Database Connection</span>
            <Database className={`w-5 h-5 ${dbStatus.success ? "text-emerald-400" : "text-amber-400"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${dbStatus.success ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <h3 className="text-base font-bold text-white">
                {dbStatus.success ? "Supabase Connected" : "Connection Pending"}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 truncate">{dbStatus.message}</p>
          </div>
        </div>

        {/* Audit Context Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit Trail Engine</span>
            <ShieldCheck className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Additive Audit Trail</h3>
            <p className="text-xs text-slate-400 mt-1">
              Zero deletion policy. Every write records acting employee ID and timestamp.
            </p>
          </div>
        </div>
      </div>

      {/* Scope Overview Box */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <Building className="w-5 h-5 text-sky-400" />
          Workflow Modules (Scaffolded)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <p className="text-xs font-bold text-sky-400">1. Requisition</p>
            <p className="text-xs text-slate-400 mt-1">Branch pharmacies request stock from Central Warehouse.</p>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <p className="text-xs font-bold text-blue-400">2. Purchase Order</p>
            <p className="text-xs text-slate-400 mt-1">Central Purchasing orders stock from external supplier.</p>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <p className="text-xs font-bold text-purple-400">3. Goods Receipt & Split</p>
            <p className="text-xs text-slate-400 mt-1">Receive orders with Accepted / Damaged / Missing split.</p>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <p className="text-xs font-bold text-amber-400">4. Invoice Matching</p>
            <p className="text-xs text-slate-400 mt-1">Match supplier invoice & credit notes against accepted goods.</p>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <p className="text-xs font-bold text-cyan-400">5. Stock Transfers</p>
            <p className="text-xs text-slate-400 mt-1">Transfer stock between locations with in-transit tracking.</p>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <p className="text-xs font-bold text-rose-400">6. Dispensing / Sales</p>
            <p className="text-xs text-slate-400 mt-1">Record patient sales/dispensing at branch pharmacies.</p>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <p className="text-xs font-bold text-teal-400">7. Stock Ledger</p>
            <p className="text-xs text-slate-400 mt-1">Full transaction log and inventory level per location.</p>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <p className="text-xs font-bold text-indigo-400">8. Receipt Correction</p>
            <p className="text-xs text-slate-400 mt-1">Additive correction logs preserving original entries.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
