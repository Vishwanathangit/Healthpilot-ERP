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
import { useActiveEmployee } from "@/context/ActiveEmployeeContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pill, PlusCircle, AlertCircle, CreditCard, DollarSign } from "lucide-react";

export default function SalesPage() {
  const { activeEmployee } = useActiveEmployee();
  const [sales, setSales] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Form State
  const [formData, setFormData] = useState({
    locationId: "",
    productId: "",
    batchId: "",
    quantity: "2",
    unitPrice: "650.00",
    taxPercent: "5.00",
    patientReference: `Patient #${Math.floor(1000 + Math.random() * 9000)} (Prescription #RX-${Math.floor(100 + Math.random() * 900)})`,
    paymentMethod: "Insurance",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, locRes, prodRes, summaryRes] = await Promise.all([
        fetch("/api/sales").then((r) => r.json()),
        fetch("/api/locations").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/stock-ledger/summary").then((r) => r.json()),
      ]);

      if (salesRes.success) setSales(salesRes.data || []);
      if (locRes.success) {
        setLocations(locRes.data || []);
        if (locRes.data?.length > 0 && !formData.locationId) {
          setFormData((prev) => ({ ...prev, locationId: String(locRes.data[0].id) }));
        }
      }
      if (prodRes.success) {
        setProducts(prodRes.data || []);
        if (prodRes.data?.length > 0 && !formData.productId) {
          setFormData((prev) => ({ ...prev, productId: String(prodRes.data[0].id) }));
        }
      }
      if (summaryRes.success) {
        setLedgerSummary(summaryRes.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch sales data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getLocationName = (id: number, fallbackName?: string) => {
    return locations.find((l) => Number(l.id) === Number(id))?.name || fallbackName || `Location #${id}`;
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) {
      setActionError("Please select an acting employee in topbar.");
      return;
    }

    const errors: { [key: string]: string } = {};
    if (!formData.locationId) errors.locationId = "Dispensing branch is required";
    if (!formData.productId) errors.productId = "Medication product is required";
    if (!formData.batchId) errors.batchId = "Stock batch is required";
    if (!formData.quantity || Number(formData.quantity) <= 0) errors.quantity = "Quantity must be greater than 0";
    if (!formData.unitPrice || Number(formData.unitPrice) < 0) errors.unitPrice = "Unit price is required";
    if (formData.taxPercent === "" || Number(formData.taxPercent) < 0) errors.taxPercent = "Tax rate is required";
    if (!formData.patientReference.trim()) errors.patientReference = "Patient reference is required";
    if (!formData.paymentMethod) errors.paymentMethod = "Payment method is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);
      setFieldErrors({});

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: Number(formData.locationId),
          productId: Number(formData.productId),
          batchId: Number(formData.batchId),
          quantity: Number(formData.quantity),
          unitPrice: Number(formData.unitPrice),
          taxPercent: Number(formData.taxPercent),
          patientReference: formData.patientReference,
          paymentMethod: formData.paymentMethod,
          dispensedBy: activeEmployee.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to record sales transaction.");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || "Failed to record sales transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pharmacy Sales & Dispensing"
        description="Record patient drug dispensing, generate invoices, and automatically deduct stock ledger inventory"
        action={
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Record Pharmacy Sale
          </Button>
        }
      />

      {/* Sales Transactions Table */}
      <Card>
        {loading ? (
          <Loader label="Loading sales log..." minHeight="350px" />
        ) : sales.length === 0 ? (
          <div className="py-[var(--space-xl)] text-center text-[var(--color-text-secondary)]">
            No sales transactions recorded yet.
          </div>
        ) : (
          <Table
            headers={[
              "Sale ID",
              "Patient / Prescription Ref",
              "Location",
              "Dispensed Qty",
              "Unit Price",
              "Total Amount",
              "Payment Method",
              "Date & Time",
            ]}
          >
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                  SALE-{sale.id}
                </TableCell>
                <TableCell className="font-semibold text-[var(--color-text-primary)]">
                  {sale.patientReference}
                </TableCell>
                <TableCell className="text-[var(--color-text-secondary)] font-medium text-xs">
                  {getLocationName(sale.locationId, sale.locationName)}
                </TableCell>
                <TableCell className="font-bold text-[var(--color-text-primary)]">
                  {sale.quantity ?? 0} Vials
                </TableCell>
                <TableCell className="text-[var(--color-text-secondary)]">
                  {formatCurrency(Number(sale.unitPrice))}
                </TableCell>
                <TableCell className="font-bold text-emerald-700">
                  {formatCurrency(Number(sale.totalAmount))}
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">{sale.paymentMethod}</Badge>
                </TableCell>
                <TableCell className="text-xs text-[var(--color-text-secondary)]">
                  {sale.saleDatetime ? formatDate(sale.saleDatetime) : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>

      {/* Record Sale Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Pharmacy Dispensing Sale"
        subtitle="Deduct inventory from selected batch, apply tax, and record patient transaction"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSale} noValidate className="flex flex-col gap-6">
          {actionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Row 1: Branch & Product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Dispensing pharmacy branch <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={formData.locationId}
                onChange={(val) => {
                  const newLocId = val;
                  const newBatches = ledgerSummary.filter(
                    (b) => Number(b.locationId) === Number(newLocId)
                  );
                  const newBatchId = newBatches.length > 0 ? String(newBatches[0].batchId) : "";
                  setFormData((prev) => ({
                    ...prev,
                    locationId: newLocId,
                    batchId: newBatchId,
                  }));
                  if (fieldErrors.locationId) setFieldErrors((prev) => ({ ...prev, locationId: "" }));
                }}
                options={locations.map((loc) => ({ value: String(loc.id), label: `${loc.name} (${loc.type})` }))}
                error={fieldErrors.locationId}
              />
              {fieldErrors.locationId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.locationId}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Medication product <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={formData.productId}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, productId: val }));
                  if (fieldErrors.productId) setFieldErrors((prev) => ({ ...prev, productId: "" }));
                }}
                options={products.map((prod) => ({ value: String(prod.id), label: prod.name }))}
                error={fieldErrors.productId}
              />
              {fieldErrors.productId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.productId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Batch (Filtered by Selected Location) & Dispensed Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Batch (available at branch) <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={formData.batchId}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, batchId: val }));
                  if (fieldErrors.batchId) setFieldErrors((prev) => ({ ...prev, batchId: "" }));
                }}
                options={(() => {
                  const filtered = ledgerSummary.filter((b) => {
                    const matchesLocation = !formData.locationId || Number(b.locationId) === Number(formData.locationId);
                    const qty = b.usableStock ?? b.availableQuantity ?? 0;
                    return matchesLocation && qty > 0;
                  });

                  if (filtered.length === 0) {
                    return [{ value: "", label: "No available stock batches at this branch" }];
                  }

                  return filtered.map((b) => {
                    const batchNum = b.batchNumber || `Batch #${b.batchId}`;
                    const availQty = b.usableStock ?? b.availableQuantity ?? 0;
                    return {
                      value: String(b.batchId),
                      label: `${batchNum} (Avail: ${availQty} Vials)`,
                    };
                  });
                })()}
                error={fieldErrors.batchId}
              />
              {fieldErrors.batchId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.batchId}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Dispensed quantity (vials) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }));
                  if (fieldErrors.quantity) setFieldErrors((prev) => ({ ...prev, quantity: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.quantity ? "border-rose-500 ring-2 ring-rose-500/20" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs`}
              />
              {fieldErrors.quantity && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.quantity}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Unit Price & Tax Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Selling unit price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, unitPrice: e.target.value }));
                  if (fieldErrors.unitPrice) setFieldErrors((prev) => ({ ...prev, unitPrice: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.unitPrice ? "border-rose-500 ring-2 ring-rose-500/20" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs`}
              />
              {fieldErrors.unitPrice && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.unitPrice}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Tax rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.taxPercent}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, taxPercent: e.target.value }));
                  if (fieldErrors.taxPercent) setFieldErrors((prev) => ({ ...prev, taxPercent: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.taxPercent ? "border-rose-500 ring-2 ring-rose-500/20" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs`}
              />
              {fieldErrors.taxPercent && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.taxPercent}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Payment Method & Patient Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Payment method <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={formData.paymentMethod}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, paymentMethod: val }));
                  if (fieldErrors.paymentMethod) setFieldErrors((prev) => ({ ...prev, paymentMethod: "" }));
                }}
                options={[
                  { value: "Insurance", label: "Insurance Claim" },
                  { value: "Cash", label: "Cash" },
                  { value: "Credit Card", label: "Credit / Debit Card" },
                ]}
                error={fieldErrors.paymentMethod}
              />
              {fieldErrors.paymentMethod && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.paymentMethod}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Patient / prescription reference
              </label>
              <input
                type="text"
                value={formData.patientReference}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, patientReference: e.target.value }));
                  if (fieldErrors.patientReference) setFieldErrors((prev) => ({ ...prev, patientReference: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.patientReference ? "border-rose-500 ring-2 ring-rose-500/20" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs`}
              />
              {fieldErrors.patientReference && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.patientReference}</span>
                </p>
              )}
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div
            className="mt-6 pt-5 border-t border-[var(--color-border)] flex items-center justify-end gap-3"
            style={{ marginTop: "24px", paddingTop: "20px" }}
          >
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Confirm & Dispense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
