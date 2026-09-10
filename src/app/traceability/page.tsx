"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Loader } from "@/components/ui/Loader";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  GitBranch,
  Search,
  ClipboardList,
  ShoppingCart,
  PackageCheck,
  Receipt,
  ShieldCheck,
  Boxes,
  Info,
} from "lucide-react";

function TraceabilityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string>(() => searchParams.get("reqId") || "1");
  const [traceData, setTraceData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [locations, setLocations] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Sync with URL query parameter
  useEffect(() => {
    const reqIdParam = searchParams.get("reqId");
    if (reqIdParam && reqIdParam !== selectedReqId) {
      setSelectedReqId(reqIdParam);
    }
  }, [searchParams]);

  const handleSelectReqId = (id: string) => {
    setSelectedReqId(id);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("reqId", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [reqRes, locRes, batchRes, prodRes, supRes] = await Promise.all([
          fetch("/api/requisitions").then((r) => r.json()),
          fetch("/api/locations").then((r) => r.json()),
          fetch("/api/batches").then((r) => r.json()),
          fetch("/api/products").then((r) => r.json()),
          fetch("/api/suppliers").then((r) => r.json()),
        ]);

        if (reqRes.success && reqRes.data?.length > 0) {
          setRequisitions(reqRes.data);
          const reqIdParam = searchParams.get("reqId");
          if (!reqIdParam) {
            setSelectedReqId(String(reqRes.data[0].id));
          }
        }
        if (locRes.success) setLocations(locRes.data || []);
        if (batchRes.success) setBatches(batchRes.data || []);
        if (prodRes.success) setProducts(prodRes.data || []);
        if (supRes.success) setSuppliers(supRes.data || []);
      } catch (err) {
        console.error("Failed to load initial traceability data", err);
      }
    }
    loadInitialData();
  }, []);

  const getLocationName = (id?: number, fallbackName?: string) => {
    if (!id) return fallbackName || "N/A";
    return locations.find((l) => Number(l.id) === Number(id))?.name || fallbackName || `Location #${id}`;
  };

  const getProductName = (id?: number, fallbackName?: string) => {
    if (!id) return fallbackName || "Insulin Glargine 100 IU/ml";
    return products.find((p) => Number(p.id) === Number(id))?.name || fallbackName || `Product #${id}`;
  };

  const getSupplierName = (id?: number, fallbackName?: string) => {
    if (!id) return fallbackName || "MedSupply Pharma Corp";
    return suppliers.find((s) => Number(s.id) === Number(id))?.name || fallbackName || `Supplier #${id}`;
  };

  const getBatchNumber = (id?: number, fallbackNumber?: string) => {
    if (!id) return fallbackNumber || "N/A";
    return batches.find((b) => Number(b.id) === Number(id))?.batchNumber || fallbackNumber || `Batch #${id}`;
  };

  // Fetch full audit trail whenever selectedReqId changes
  const fetchTraceability = async (reqId: string) => {
    if (!reqId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/traceability/${reqId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Traceability data not found for REQ-${reqId}.`);
      }
      setTraceData(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load audit trail.");
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReqId) {
      fetchTraceability(selectedReqId);
    }
  }, [selectedReqId]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Pharmaceutical Traceability & Audit Trail"
        description="Trace the complete lifecycle of Insulin Glargine batches from Requisition to PO, GRN, Stock Ledger, Pharmacy Sales, and 3-Way Invoice Matching"
      />

      {/* Requisition Selector Bar */}
      <Card className="p-6 overflow-visible">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl shrink-0 text-[var(--color-accent)]">
              <GitBranch className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Select Requisition to Trace
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <CustomSelect
                  value={selectedReqId}
                  onChange={(val) => handleSelectReqId(val)}
                  options={requisitions.map((req) => ({
                    value: String(req.id),
                    label: `REQ-${req.id} — ${req.quantity} Vials for ${getLocationName(req.locationId, req.locationName)} (${req.status})`,
                  }))}
                  className="flex-1 min-w-[280px]"
                />
                <Button variant="secondary" size="md" onClick={() => fetchTraceability(selectedReqId)}>
                  <Search className="w-4 h-4 mr-2" />
                  Inspect Trail
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 shadow-2xs flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Audit Compliance Standard</p>
              <p className="text-slate-600 font-medium mt-0.5">DSCSA / FDA Batch Tracking & 3-Way Match Audit</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Audit Tree Display */}
      {loading ? (
        <Loader label="Tracing batch lifecycle and audit chain..." minHeight="350px" />
      ) : error ? (
        <Card className="bg-rose-50 border-rose-200 text-rose-800 p-6 text-center text-sm font-semibold rounded-xl">
          {error}
        </Card>
      ) : !traceData ? (
        <Card className="p-12 text-center text-[var(--color-text-secondary)] font-medium text-sm rounded-xl">
          Select a Requisition above to view its full end-to-end audit trail.
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Step 1: Requisition */}
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-teal-100 rounded-lg text-teal-800">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-base">
                    Step 1: Internal Stock Requisition (REQ-{traceData.requisition?.id})
                  </span>
                </div>
                <Badge variant={traceData.requisition?.status === "approved" || traceData.requisition?.status === "fulfilled" ? "success" : "warning"}>
                  {traceData.requisition?.status?.toUpperCase()}
                </Badge>
              </div>
            }
          >
            <div className="p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Requesting Location
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {getLocationName(traceData.requisition?.locationId, traceData.requisition?.locationName)}
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-xl space-y-1">
                  <span className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    Requested Quantity
                  </span>
                  <p className="font-bold text-emerald-900 text-sm">
                    {traceData.requisition?.quantity} Vials
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Required Date
                  </span>
                  <p className="font-bold text-slate-800 text-sm">
                    {traceData.requisition?.requiredDate}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Approval Status
                  </span>
                  <div className="pt-0.5">
                    <Badge variant={traceData.requisition?.status === "approved" || traceData.requisition?.status === "fulfilled" ? "success" : "warning"}>
                      {traceData.requisition?.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {traceData.requisition?.reason && (
                <div className="mt-4 p-3.5 px-4 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Justification:</strong> "{traceData.requisition.reason}"
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Step 2: Issued Purchase Orders & Complete Supply Chain Steps */}
          {(!traceData.purchaseOrders || traceData.purchaseOrders.length === 0) ? (
            <Card
              header={
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-100 rounded-lg text-blue-800">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-base">Step 2: Issued Supplier Purchase Orders</span>
                </div>
              }
            >
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>No official supplier Purchase Order has been issued for this requisition yet.</span>
              </div>
            </Card>
          ) : (
            traceData.purchaseOrders.map((poGroup: any, poIdx: number) => {
              const po = poGroup.purchaseOrder;
              const goodsReceipts = poGroup.goodsReceipts || [];
              const supplierInvoices = poGroup.supplierInvoices || [];
              const stockTransfers = poGroup.stockTransfers || [];
              const allSales = poGroup.allSales || [];

              return (
                <div key={`po-group-${po.id || poIdx}`} className="flex flex-col gap-6">
                  {/* Step 2 Card: Purchase Order */}
                  <Card
                    header={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-800">
                            <ShoppingCart className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 text-base">
                            Step 2: Issued Purchase Order ({po.poNumber || `PO-${po.id}`})
                          </span>
                        </div>
                        <Badge variant={po.status === "completed" ? "success" : "info"}>
                          {po.status?.toUpperCase()}
                        </Badge>
                      </div>
                    }
                  >
                    <div className="p-2 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                          <span className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                            Vendor / Supplier
                          </span>
                          <p className="font-bold text-slate-900 text-sm truncate">
                            {getSupplierName(po.supplierId, po.supplierName)}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                          <span className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                            Order Date
                          </span>
                          <p className="font-bold text-slate-800 text-sm">{po.orderDate || "N/A"}</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                          <span className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                            Delivery Location
                          </span>
                          <p className="font-bold text-slate-900 text-sm">
                            {getLocationName(po.deliveryLocationId)}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                          <span className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                            PO Status
                          </span>
                          <div className="pt-0.5">
                            <Badge variant={po.status === "completed" ? "success" : "info"}>{po.status}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* PO Lines */}
                      {po.lines && po.lines.length > 0 && (
                        <div className="mt-4">
                          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                            Purchase Order Items ({po.lines.length} items)
                          </span>
                          <Table headers={["Line #", "Product", "Ordered Qty", "Unit Price", "Tax %", "Line Total"]}>
                            {po.lines.map((line: any) => (
                              <TableRow key={`po-line-${line.id}`}>
                                <TableCell className="font-mono text-xs font-bold">Line #{line.id}</TableCell>
                                <TableCell className="font-medium text-slate-900">{getProductName(line.productId)}</TableCell>
                                <TableCell className="font-bold text-slate-900">{line.quantity} Vials</TableCell>
                                <TableCell className="font-semibold text-slate-700">{formatCurrency(Number(line.unitPrice))}</TableCell>
                                <TableCell className="text-slate-600">{line.taxPercent}%</TableCell>
                                <TableCell className="font-bold text-teal-800">{formatCurrency(Number(line.lineTotal))}</TableCell>
                              </TableRow>
                            ))}
                          </Table>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Step 3: Goods Receipts Notes & Batch Inspections */}
                  <Card
                    header={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
                            <PackageCheck className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 text-base">
                            Step 3: Goods Receipts Notes & Batch Physical Inspections ({goodsReceipts.length} Receipts)
                          </span>
                        </div>
                      </div>
                    }
                  >
                    <div className="p-2 space-y-6">
                      {goodsReceipts.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 flex items-center gap-2.5">
                          <Info className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>No physical Goods Receipt Notes (GRN) recorded yet.</span>
                        </div>
                      ) : (
                        goodsReceipts.map((grGroup: any, grIdx: number) => {
                          const grn = grGroup.goodsReceipt;
                          const grnLines = grGroup.lines || [];

                          return (
                            <div key={`grn-${grn.id || grIdx}`} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-sm font-bold text-slate-900">{grn.grnNumber || `GRN-${grn.id}`}</span>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs font-semibold text-slate-700">Delivery Ref: {grn.supplierDeliveryReference}</span>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs text-slate-600">Received Date: {grn.receivedDate}</span>
                                </div>
                                <Badge variant={grn.status === "corrected" ? "warning" : "success"}>
                                  {grn.status?.toUpperCase()}
                                </Badge>
                              </div>

                              <Table headers={["Batch #", "Physical Recv", "Accepted Qty", "Damaged Qty", "Missing Qty", "Line Inspection Status"]}>
                                {grnLines.map((grLineItem: any, lIdx: number) => {
                                  const line = grLineItem.line;
                                  const corrections = grLineItem.corrections || [];
                                  return (
                                    <React.Fragment key={`grn-line-${line.id || lIdx}`}>
                                      <TableRow>
                                        <TableCell className="font-mono text-xs">
                                          <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-800">
                                            {getBatchNumber(line.batchId)}
                                          </span>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-800">{line.physicalQuantity} Vials</TableCell>
                                        <TableCell className="font-bold text-emerald-700">{line.acceptedQuantity} Vials</TableCell>
                                        <TableCell className="font-semibold text-amber-700">{line.damagedQuantity || 0} Vials</TableCell>
                                        <TableCell className="font-semibold text-rose-600">{line.missingQuantity || 0} Vials</TableCell>
                                        <TableCell>
                                          <Badge variant={corrections.length > 0 ? "warning" : "success"}>
                                            {corrections.length > 0 ? "POST-AUDIT CORRECTED" : "VERIFIED ACCEPTED"}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                      {corrections.map((corr: any, cIdx: number) => (
                                        <tr key={`corr-${corr.id || cIdx}`} className="bg-amber-50/50">
                                          <td colSpan={6} className="px-4 py-2.5 border-t border-amber-200/60 text-xs text-amber-900">
                                            <div className="flex items-center gap-2">
                                              <Info className="w-4 h-4 text-amber-600 shrink-0" />
                                              <div>
                                                <span className="font-bold text-amber-950">Post-GRN Quality Audit Correction: </span>
                                                <span>Original Accepted: {corr.originalAcceptedQty} Vials → Corrected Accepted: <strong className="text-emerald-800">{corr.correctedAcceptedQty} Vials</strong>, Damaged: <strong className="text-amber-800">{corr.correctedDamagedQty}</strong>, Missing: <strong className="text-rose-700">{corr.correctedMissingQty}</strong>. </span>
                                                <span className="italic text-slate-600">Reason: "{corr.reason}"</span>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </React.Fragment>
                                  );
                                })}
                              </Table>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>

                  {/* Step 4: Supplier Invoices & 3-Way Reconciliation */}
                  <Card
                    header={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 text-base">
                            Step 4: Financial 3-Way Matching & Supplier Invoices ({supplierInvoices.length} Invoices)
                          </span>
                        </div>
                      </div>
                    }
                  >
                    <div className="p-2 space-y-6">
                      {supplierInvoices.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 flex items-center gap-2.5">
                          <Info className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>No supplier invoices recorded for 3-way financial matching yet.</span>
                        </div>
                      ) : (
                        supplierInvoices.map((invGroup: any, invIdx: number) => {
                          const inv = invGroup.invoice;
                          const match = invGroup.match;
                          const creditNotes = invGroup.creditNotes || [];

                          return (
                            <div key={`inv-${inv.id || invIdx}`} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-sm font-bold text-slate-900">{inv.invoiceNumber}</span>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs font-semibold text-slate-700">Invoiced Qty: {inv.invoiceQuantity} Vials</span>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs font-bold text-teal-900">Total Billed: {formatCurrency(Number(inv.invoiceAmount))}</span>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs text-slate-600">Invoice Date: {inv.invoiceDate}</span>
                                </div>
                                <Badge variant={match?.status === "resolved" || match?.status === "matched" ? "success" : "warning"}>
                                  {match?.status ? match.status.toUpperCase() : "UNMATCHED"}
                                </Badge>
                              </div>

                              {match && (
                                <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-xl space-y-3">
                                  <span className="block text-xs font-bold text-emerald-900 uppercase tracking-wide">
                                    3-Way Reconciliation Audit Result
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                                      <span className="text-slate-500 block font-medium">Accepted Goods Value</span>
                                      <span className="font-bold text-slate-900 text-sm">{formatCurrency(Number(match.acceptedValue))}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                                      <span className="text-slate-500 block font-medium">Tax Amount</span>
                                      <span className="font-bold text-slate-900 text-sm">{formatCurrency(Number(match.taxAmount))}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                                      <span className="text-slate-500 block font-medium">Net Payable Amount</span>
                                      <span className="font-bold text-emerald-700 text-sm">{formatCurrency(Number(match.payableAmount))}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                                      <span className="text-slate-500 block font-medium">Disputed Amount</span>
                                      <span className="font-bold text-rose-600 text-sm">{formatCurrency(Number(match.disputedAmount))}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {creditNotes.length > 0 && (
                                <div className="space-y-2">
                                  <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Supplier Credit Notes Issued ({creditNotes.length})
                                  </span>
                                  <Table headers={["Credit Note #", "Adjusted Qty", "Credit Amount (₹)", "Discrepancy Justification"]}>
                                    {creditNotes.map((cn: any) => (
                                      <TableRow key={`cn-${cn.id}`}>
                                        <TableCell className="font-mono text-xs font-bold text-slate-900">{cn.creditNoteNumber}</TableCell>
                                        <TableCell className="font-semibold text-slate-800">{cn.quantity} Vials</TableCell>
                                        <TableCell className="font-bold text-emerald-700">{formatCurrency(Number(cn.amount))}</TableCell>
                                        <TableCell className="text-xs text-slate-600 font-medium">{cn.reason}</TableCell>
                                      </TableRow>
                                    ))}
                                  </Table>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>

                  {/* Step 5: Stock Transfers & Pharmacy Point-of-Sale Dispatches */}
                  <Card
                    header={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-purple-100 rounded-lg text-purple-800">
                            <Boxes className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 text-base">
                            Step 5: Stock Transfers & Pharmacy Dispensing Sales ({stockTransfers.length} Transfers, {allSales.length} Total Sales)
                          </span>
                        </div>
                      </div>
                    }
                  >
                    <div className="p-2 space-y-6">
                      {stockTransfers.length === 0 && allSales.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 flex items-center gap-2.5">
                          <Info className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>No internal stock transfers or pharmacy sales recorded for this batch yet.</span>
                        </div>
                      ) : (
                        <>
                          {/* Stock Transfers Section (if any) */}
                          {stockTransfers.length > 0 &&
                            stockTransfers.map((stGroup: any, stIdx: number) => {
                              const transfer = stGroup.transfer;
                              const sales = stGroup.sales || [];

                              return (
                                <div key={`st-${transfer.id || stIdx}`} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
                                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-sm font-bold text-slate-900">{transfer.transferNumber || `TRF-${transfer.id}`}</span>
                                      <span className="text-xs text-slate-500">•</span>
                                      <span className="text-xs font-semibold text-slate-800">
                                        {getLocationName(transfer.sourceLocationId)} → {getLocationName(transfer.destinationLocationId)}
                                      </span>
                                      <span className="text-xs text-slate-500">•</span>
                                      <span className="text-xs font-bold text-purple-900">Transferred: {transfer.quantity} Vials</span>
                                    </div>
                                    <Badge variant={transfer.status === "received" ? "success" : "info"}>
                                      {transfer.status?.toUpperCase()}
                                    </Badge>
                                  </div>

                                  {sales.length > 0 && (
                                    <div className="space-y-2">
                                      <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                                        Pharmacy Point-of-Sale Dispensing Records ({sales.length} Sales)
                                      </span>
                                      <Table headers={["Sale #", "Location", "Dispensed Qty", "Unit Price", "Total (₹)", "Patient Ref", "Payment Method", "Timestamp"]}>
                                        {sales.map((sale: any) => (
                                          <TableRow key={`sale-${sale.id}`}>
                                            <TableCell className="font-mono text-xs font-bold text-slate-900">{sale.saleNumber}</TableCell>
                                            <TableCell className="font-semibold text-slate-800">{getLocationName(sale.locationId)}</TableCell>
                                            <TableCell className="font-bold text-purple-700">{sale.quantity} Vials</TableCell>
                                            <TableCell className="font-semibold text-slate-700">{formatCurrency(Number(sale.unitPrice))}</TableCell>
                                            <TableCell className="font-bold text-teal-800">{formatCurrency(Number(sale.totalAmount))}</TableCell>
                                            <TableCell className="font-mono text-xs text-slate-700">{sale.patientReference}</TableCell>
                                            <TableCell className="capitalize text-xs font-medium text-slate-600">{sale.paymentMethod}</TableCell>
                                            <TableCell className="text-xs font-medium text-slate-500">{formatDate(sale.saleDatetime)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </Table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                          {/* Direct Branch Dispensing Sales (when stock received directly at branch with no intermediate transfer) */}
                          {stockTransfers.length === 0 && allSales.length > 0 && (
                            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                                  Direct Branch Point-of-Sale Dispensing ({allSales.length} Sales)
                                </span>
                                <Badge variant="info">DIRECT DELIVERY SALE</Badge>
                              </div>
                              <Table headers={["Sale #", "Location", "Dispensed Qty", "Unit Price", "Total (₹)", "Patient Ref", "Payment Method", "Timestamp"]}>
                                {allSales.map((sale: any) => (
                                  <TableRow key={`direct-sale-${sale.id}`}>
                                    <TableCell className="font-mono text-xs font-bold text-slate-900">{sale.saleNumber}</TableCell>
                                    <TableCell className="font-semibold text-slate-800">{getLocationName(sale.locationId)}</TableCell>
                                    <TableCell className="font-bold text-purple-700">{sale.quantity} Vials</TableCell>
                                    <TableCell className="font-semibold text-slate-700">{formatCurrency(Number(sale.unitPrice))}</TableCell>
                                    <TableCell className="font-bold text-teal-800">{formatCurrency(Number(sale.totalAmount))}</TableCell>
                                    <TableCell className="font-mono text-xs text-slate-700">{sale.patientReference}</TableCell>
                                    <TableCell className="capitalize text-xs font-medium text-slate-600">{sale.paymentMethod}</TableCell>
                                    <TableCell className="text-xs font-medium text-slate-500">{formatDate(sale.saleDatetime)}</TableCell>
                                  </TableRow>
                                ))}
                              </Table>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function TraceabilityPage() {
  return (
    <Suspense fallback={<Loader label="Loading traceability..." minHeight="400px" />}>
      <TraceabilityContent />
    </Suspense>
  );
}
