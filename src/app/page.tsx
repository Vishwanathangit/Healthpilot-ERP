"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Loader } from "@/components/ui/Loader";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ClipboardList,
  ShoppingCart,
  PackageCheck,
  Pill,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Boxes,
  PlusCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [reqRes, poRes, salesRes, summaryRes, locRes, prodRes, batchRes] = await Promise.all([
          fetch("/api/requisitions").then((r) => r.json()),
          fetch("/api/purchase-orders").then((r) => r.json()),
          fetch("/api/sales").then((r) => r.json()),
          fetch("/api/stock-ledger/summary").then((r) => r.json()),
          fetch("/api/locations").then((r) => r.json()),
          fetch("/api/products").then((r) => r.json()),
          fetch("/api/batches").then((r) => r.json()),
        ]);

        if (reqRes.success) setRequisitions(reqRes.data || []);
        if (poRes.success) setPurchaseOrders(poRes.data || []);
        if (salesRes.success) setSales(salesRes.data || []);
        if (summaryRes.success) setLedgerSummary(summaryRes.data || []);
        if (locRes.success) setLocations(locRes.data || []);
        if (prodRes.success) setProducts(prodRes.data || []);
        if (batchRes.success) setBatches(batchRes.data || []);
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const getLocationName = (id: number, fallbackName?: string) => {
    return locations.find((l) => Number(l.id) === Number(id))?.name || fallbackName || `Location #${id}`;
  };

  const getProductName = (id: number, fallbackName?: string) => {
    return products.find((p) => Number(p.id) === Number(id))?.name || fallbackName || `Product #${id}`;
  };

  const getBatchNumber = (id: number, fallbackNumber?: string) => {
    return batches.find((b) => Number(b.id) === Number(id))?.batchNumber || fallbackNumber || `Batch #${id}`;
  };

  // Compute Metrics
  const pendingReqs = requisitions.filter((r) => r.status === "pending_approval").length;
  const pendingPOs = purchaseOrders.filter(
    (po) => po.status === "sent" || po.status === "partially_received"
  ).length;
  const totalSalesCount = sales.length;
  const totalSalesRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
  const totalAvailableStock = ledgerSummary.reduce(
    (acc, pos) => acc + Number(pos.availableQuantity ?? pos.usableStock ?? 0),
    0
  );

  if (loading) {
    return (
      <div className="space-y-[var(--space-lg)]">
        <PageHeader
          title="Dashboard"
          description="Hospital Pharmacy & Supply Chain Operational Overview"
        />
        <Loader label="Loading operational metrics & inventory positions..." minHeight="400px" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Hospital Pharmacy & Supply Chain Operational Overview"
        action={
          <div className="flex items-center gap-[var(--space-sm)]">
            <Link href="/requisitions">
              <Button variant="secondary" size="sm">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                New Requisition
              </Button>
            </Link>
            <Link href="/sales">
              <Button variant="primary" size="sm">
                <Pill className="w-4 h-4 mr-1.5" />
                Record Sale
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[var(--space-md)]">
        {/* Card 1: Total Stock */}
        <Card className="bg-gradient-to-br from-white to-teal-50/40 border-teal-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Total stock position
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-[var(--space-xs)]">
                {loading ? "..." : `${totalAvailableStock} Vials`}
              </h3>
              <p className="text-xs text-teal-700 font-medium mt-[var(--space-xs)] flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5" /> Across all branches
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-100/80 text-[var(--color-accent)] flex items-center justify-center shrink-0">
              <Boxes className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Card 2: Pending Requisitions */}
        <Card className="bg-gradient-to-br from-white to-amber-50/40 border-amber-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Pending approvals
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-[var(--space-xs)]">
                {loading ? "..." : pendingReqs}
              </h3>
              <p className="text-xs text-amber-700 font-medium mt-[var(--space-xs)] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Requisitions awaiting action
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Card 3: Pending Purchase Orders */}
        <Card className="bg-gradient-to-br from-white to-blue-50/40 border-blue-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Active purchase orders
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-[var(--space-xs)]">
                {loading ? "..." : pendingPOs}
              </h3>
              <p className="text-xs text-blue-700 font-medium mt-[var(--space-xs)] flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5" /> Pending delivery / GRN
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Card 4: Total Sales Revenue */}
        <Card className="bg-gradient-to-br from-white to-emerald-50/40 border-emerald-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Sales revenue
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-[var(--space-xs)]">
                {loading ? "..." : formatCurrency(totalSalesRevenue)}
              </h3>
              <p className="text-xs text-emerald-700 font-medium mt-[var(--space-xs)] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> {totalSalesCount} Dispensed orders
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <Pill className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Stock Positions & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[var(--space-lg)] items-start">
        {/* Left Column: Current Stock Positions */}
        <div className="xl:col-span-2 space-y-[var(--space-lg)]">
          <Card
            header={
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">
                  Branch Stock Positions (Insulin Glargine)
                </span>
                <Link
                  href="/stock-ledger"
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  Full Stock Ledger <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            }
          >
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                Loading stock positions...
              </div>
            ) : ledgerSummary.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No stock position data available yet.
              </div>
            ) : (
              <Table
                headers={[
                  "Location",
                  "Batch Number",
                  "Available Stock",
                  "Reserved Stock",
                  "Total Stock",
                  "Status",
                ]}
              >
                {ledgerSummary.map((pos, idx) => {
                  const availQty = pos.availableQuantity ?? pos.usableStock ?? 0;
                  const isLow = Number(availQty) < 10;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-slate-800">
                        {getLocationName(pos.locationId, pos.locationName)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {getBatchNumber(pos.batchId, pos.batchNumber)}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {availQty} Vials
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {pos.reservedQuantity ?? 0} Vials
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {pos.totalQuantity ?? availQty} Vials
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
            )}
          </Card>

          {/* Recent Requisitions */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">
                  Recent Internal Requisitions
                </span>
                <Link
                  href="/requisitions"
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  View All Requisitions <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            }
          >
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                Loading requisitions...
              </div>
            ) : requisitions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No requisitions recorded.
              </div>
            ) : (
              <Table headers={["ID", "Branch", "Quantity", "Required Date", "Status"]}>
                {requisitions.slice(0, 5).map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      REQ-{req.id}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {getLocationName(req.locationId, req.locationName)}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {req.quantity ?? 0} Vials
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {req.requiredDate}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          req.status === "approved"
                            ? "success"
                            : req.status === "pending_approval"
                            ? "warning"
                            : req.status === "rejected"
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {req.status?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </Card>
        </div>

        {/* Right Column: Workflow Shortcuts & Recent Sales */}
        <div className="space-y-[var(--space-lg)]">
          {/* Quick Action Navigation */}
          <Card header={<span className="font-bold text-slate-800 text-sm">Operational Workflows</span>}>
            <div className="space-y-2.5">
              <Link
                href="/requisitions"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:border-teal-500 hover:bg-teal-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-teal-100 text-[var(--color-accent)] flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[var(--color-accent)] truncate">
                      1. Requisitions
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">Request stock for pharmacy branch</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>

              <Link
                href="/purchase-orders"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:border-teal-500 hover:bg-teal-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[var(--color-accent)] truncate">
                      2. Purchase Orders
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">Issue PO from approved requisition</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>

              <Link
                href="/goods-receipts"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:border-teal-500 hover:bg-teal-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[var(--color-accent)] truncate">
                      3. Goods Receipt (GRN)
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">Inspect physical stock & record batch</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>

              <Link
                href="/invoices"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:border-teal-500 hover:bg-teal-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[var(--color-accent)] truncate">
                      4. Invoices & 3-Way Match
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">Verify PO, GRN & supplier invoice</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            </div>
          </Card>

          {/* Recent Pharmacy Sales */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">Recent Sales Activity</span>
                <Link
                  href="/sales"
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  View Sales <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            }
          >
            {loading ? (
              <div className="py-6 text-center text-slate-400 text-sm animate-pulse">
                Loading sales...
              </div>
            ) : sales.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm">
                No recent sales recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {sales.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-200/60 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {s.patientReference || `Patient Sale #${s.id}`}
                      </p>
                      <p className="text-slate-500 text-[11px] truncate">
                        Qty: {s.quantity} Vials • {s.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-emerald-700">
                        {formatCurrency(Number(s.totalAmount))}
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        {s.saleDatetime ? formatDate(s.saleDatetime) : "Just now"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
