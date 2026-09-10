"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Loader } from "@/components/ui/Loader";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, PlusCircle, CheckCheck, FileText, AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function InvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [matchResult, setMatchResult] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
    purchaseOrderId: "",
    invoiceAmount: "50000.00",
    invoiceQuantity: "100",
    invoiceDate: new Date().toISOString().split("T")[0],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, poRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/purchase-orders"),
      ]);
      const invJson = await invRes.json();
      const poJson = await poRes.json();

      if (invJson.success) setInvoices(invJson.data || []);
      if (poJson.success) {
        setPurchaseOrders(poJson.data || []);
        if (poJson.data?.length > 0 && !formData.purchaseOrderId) {
          setFormData((prev) => ({ ...prev, purchaseOrderId: String(poJson.data[0].id) }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch invoice data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const errs: Record<string, string> = {};
    if (!formData.invoiceNumber.trim()) errs.invoiceNumber = "Vendor invoice number is required.";
    if (!formData.purchaseOrderId) errs.purchaseOrderId = "Linked purchase order is required.";
    if (!formData.invoiceQuantity || Number(formData.invoiceQuantity) <= 0) errs.invoiceQuantity = "Valid invoiced quantity is required.";
    if (!formData.invoiceAmount || Number(formData.invoiceAmount) <= 0) errs.invoiceAmount = "Valid total billed amount is required.";
    if (!formData.invoiceDate) errs.invoiceDate = "Invoice date is required.";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    try {
      setSubmitting(true);
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: formData.invoiceNumber,
          purchaseOrderId: Number(formData.purchaseOrderId),
          invoiceAmount: Number(formData.invoiceAmount),
          invoiceQuantity: Number(formData.invoiceQuantity),
          invoiceDate: formData.invoiceDate,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to record supplier invoice.");
      }

      showToast(`Supplier Invoice ${formData.invoiceNumber} recorded successfully!`, "success", "Invoice Created");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || "Failed to record supplier invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePerform3WayMatch = async (invoiceId: number) => {
    try {
      setMatchResult(null);
      const res = await fetch(`/api/invoices/${invoiceId}/match`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Matching process failed.", "error", "3-Way Match Failed");
        return;
      }
      setMatchResult(json.data);
      showToast(`3-Way Match evaluation completed. Result: ${json.data.status}`, "success", "3-Way Match Completed");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Matching process failed.", "error", "3-Way Match Exception");
    }
  };

  const handleIssueCreditNote = async (invoiceId: number) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/credit-note`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Credit note creation failed.", "error", "Issue Credit Note Failed");
        return;
      }
      showToast(`Credit Note CN-${json.data.id} issued for ${formatCurrency(Number(json.data.amount))}`, "success", "Credit Note Issued");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Credit note creation failed.", "error", "Issue Credit Note Failed");
    }
  };

  return (
    <div className="flex flex-col gap-6 min-w-0 max-w-full">
      <PageHeader
        title="Invoices & 3-Way Matching"
        description="Record vendor financial invoices and perform 3-Way Matching against Purchase Orders and Goods Receipts"
        action={
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Record Supplier Invoice
          </Button>
        }
      />

      {/* Match Result Banner if triggered */}
      {matchResult && (
        <Card className={matchResult.status === "matched" ? "bg-emerald-50/90 border-emerald-300 min-w-0" : "bg-amber-50/90 border-amber-300 min-w-0"}>
          <div className="flex items-start gap-3 min-w-0">
            {matchResult.status === "matched" ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs min-w-0">
              <div className="flex items-center justify-between gap-3 mr-2 sm:mr-4">
                <h3 className="font-bold text-slate-900 text-sm truncate">
                  3-Way Match Result: Status = {String(matchResult.status || "unmatched").toUpperCase()}
                </h3>
                <button
                  onClick={() => setMatchResult(null)}
                  className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 shrink-0 shadow-2xs transition-colors"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-slate-600 mt-1">
                Invoice #{matchResult.supplierInvoiceId} matched against PO #{matchResult.purchaseOrderId} & GRN #{matchResult.goodsReceiptId}.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono bg-white p-3 rounded-lg border border-slate-200 shadow-2xs min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">Disputed Amount / Price Var</span>
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {formatCurrency(Number(matchResult.priceVariance ?? matchResult.disputedAmount ?? 0))}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">Qty Variance</span>
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {matchResult.quantityVariance !== undefined
                      ? `${matchResult.quantityVariance} Vials`
                      : matchResult.invoiceQuantity && matchResult.acceptedQuantity !== undefined
                      ? `${Number(matchResult.invoiceQuantity) - Number(matchResult.acceptedQuantity)} Vials`
                      : "0 Vials"}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">Status</span>
                  <span className={`text-sm font-bold truncate ${matchResult.status === "matched" ? "text-emerald-700" : "text-amber-700"}`}>
                    {String(matchResult.status || "unmatched").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Invoices Table */}
      <Card>
        {loading ? (
          <Loader label="Loading supplier invoices..." minHeight="350px" />
        ) : invoices.length === 0 ? (
          <div className="py-[var(--space-xl)] text-center text-[var(--color-text-secondary)]">
            No supplier invoices recorded yet.
          </div>
        ) : (
          <Table
            headers={[
              "Invoice #",
              "Linked PO",
              "Invoice Date",
              "Invoiced Qty",
              "Invoice Amount",
              "Matching Status",
              "Actions",
            ]}
          >
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                  {inv.invoiceNumber}
                </TableCell>
                <TableCell className="font-mono text-xs text-[var(--color-text-secondary)]">
                  PO-{inv.purchaseOrderId}
                </TableCell>
                <TableCell className="text-xs text-[var(--color-text-secondary)]">{inv.invoiceDate}</TableCell>
                <TableCell className="font-medium text-[var(--color-text-primary)]">
                  {inv.invoiceQuantity} Vials
                </TableCell>
                <TableCell className="font-bold text-[var(--color-text-primary)]">
                  {formatCurrency(Number(inv.invoiceAmount))}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      inv.status === "matched"
                        ? "success"
                        : inv.status === "discrepancy"
                        ? "warning"
                        : "neutral"
                    }
                  >
                    {inv.status || "unmatched"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-[var(--space-sm)]">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePerform3WayMatch(inv.id)}
                      className="!py-1 !px-2.5 text-xs"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-1" />
                      3-Way Match
                    </Button>

                    {inv.status === "discrepancy" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleIssueCreditNote(inv.id)}
                        className="text-amber-700 hover:bg-amber-50 !py-1 !px-2.5 text-xs"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Credit Note
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>

      {/* Record Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Supplier Invoice"
        subtitle="Input vendor billing info to initiate financial reconciliation and 3-way matching"
        maxWidth="xl"
      >
        <form noValidate onSubmit={handleRecordInvoice} className="flex flex-col gap-6">
          {actionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Row 1: Invoice Number & Linked PO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Vendor invoice number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => {
                  setFormData({ ...formData, invoiceNumber: e.target.value });
                  if (fieldErrors.invoiceNumber) setFieldErrors((prev) => ({ ...prev, invoiceNumber: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.invoiceNumber ? "border-rose-500 ring-2 ring-rose-500/20" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs`}
              />
              {fieldErrors.invoiceNumber && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.invoiceNumber}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Linked purchase order <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={formData.purchaseOrderId}
                onChange={(val) => {
                  setFormData({ ...formData, purchaseOrderId: val });
                  if (fieldErrors.purchaseOrderId) setFieldErrors((prev) => ({ ...prev, purchaseOrderId: "" }));
                }}
                options={purchaseOrders.map((po) => ({
                  value: String(po.id),
                  label: `PO-${po.id} (${po.supplierName || `Supplier #${po.supplierId}`})`,
                }))}
                error={fieldErrors.purchaseOrderId}
              />
              {fieldErrors.purchaseOrderId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.purchaseOrderId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Invoiced Quantity & Total Billed Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Invoiced quantity (vials) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.invoiceQuantity}
                onChange={(e) => {
                  setFormData({ ...formData, invoiceQuantity: e.target.value });
                  if (fieldErrors.invoiceQuantity) setFieldErrors((prev) => ({ ...prev, invoiceQuantity: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.invoiceQuantity ? "border-rose-500 ring-2 ring-rose-500/20" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs`}
              />
              {fieldErrors.invoiceQuantity && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.invoiceQuantity}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Total billed amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.invoiceAmount}
                onChange={(e) => {
                  setFormData({ ...formData, invoiceAmount: e.target.value });
                  if (fieldErrors.invoiceAmount) setFieldErrors((prev) => ({ ...prev, invoiceAmount: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.invoiceAmount ? "border-rose-500 ring-2 ring-rose-500/20" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs`}
              />
              {fieldErrors.invoiceAmount && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.invoiceAmount}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Invoice Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Invoice date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => {
                  setFormData({ ...formData, invoiceDate: e.target.value });
                  if (fieldErrors.invoiceDate) setFieldErrors((prev) => ({ ...prev, invoiceDate: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.invoiceDate ? "border-rose-500 ring-2 ring-rose-500/20" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs cursor-pointer`}
              />
              {fieldErrors.invoiceDate && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.invoiceDate}</span>
                </p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="mt-6 pt-5 border-t border-[var(--color-border)] flex items-center justify-end gap-3"
            style={{ marginTop: "24px", paddingTop: "20px" }}
          >
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Record Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
