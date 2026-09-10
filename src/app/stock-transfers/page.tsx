"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Loader } from "@/components/ui/Loader";
import { useActiveEmployee } from "@/context/ActiveEmployeeContext";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  ArrowLeftRight,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function StockTransfersPage() {
  const { activeEmployee } = useActiveEmployee();
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<any[]>([]);
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
    sourceLocationId: "",
    destinationLocationId: "",
    productId: "",
    batchId: "",
    quantity: "50",
  });

  const [batches, setBatches] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trRes, locRes, prodRes, ledgRes, batchRes] = await Promise.all([
        fetch("/api/stock-transfers").then((r) => r.json()),
        fetch("/api/locations").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/stock-ledger/summary").then((r) => r.json()),
        fetch("/api/batches").then((r) => r.json()),
      ]);

      if (trRes.success) setTransfers(trRes.data || []);
      if (locRes.success) {
        setLocations(locRes.data || []);
        if (locRes.data?.length > 1) {
          setFormData((prev) => ({
            ...prev,
            sourceLocationId: String(locRes.data[0].id),
            destinationLocationId: String(locRes.data[1].id),
          }));
        }
      }
      if (prodRes.success) {
        setProducts(prodRes.data || []);
        if (prodRes.data?.length > 0) {
          setFormData((prev) => ({ ...prev, productId: String(prodRes.data[0].id) }));
        }
      }
      if (ledgRes.success) {
        setLedgerSummary(ledgRes.data || []);
        if (ledgRes.data?.length > 0) {
          setFormData((prev) => ({ ...prev, batchId: String(ledgRes.data[0].batchId) }));
        }
      }
      if (batchRes.success) setBatches(batchRes.data || []);
    } catch (err) {
      console.error("Failed to load stock transfers data", err);
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

  const getBatchNumber = (id: number, fallbackNumber?: string) => {
    return batches.find((b) => Number(b.id) === Number(id))?.batchNumber || fallbackNumber || `Batch #${id}`;
  };

  const handleDispatchTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) {
      setActionError("Please select an acting employee in the topbar.");
      return;
    }

    const errors: { [key: string]: string } = {};
    if (!formData.sourceLocationId) errors.sourceLocationId = "Source location is required";
    if (!formData.destinationLocationId) errors.destinationLocationId = "Destination location is required";
    if (!formData.productId) errors.productId = "Medication product is required";
    if (!formData.batchId) errors.batchId = "Available stock batch is required";
    if (!formData.quantity || Number(formData.quantity) <= 0) errors.quantity = "Quantity must be greater than 0";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (formData.sourceLocationId === formData.destinationLocationId) {
      setActionError("Source and Destination locations must be different.");
      return;
    }

    if (activeEmployee.locationId != null && Number(activeEmployee.locationId) !== Number(formData.sourceLocationId)) {
      const empLocName = getLocationName(activeEmployee.locationId);
      setActionError(`You can only dispatch transfers originating from your assigned location (${empLocName}).`);
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);
      setFieldErrors({});

      const res = await fetch("/api/stock-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLocationId: Number(formData.sourceLocationId),
          destinationLocationId: Number(formData.destinationLocationId),
          productId: Number(formData.productId),
          batchId: Number(formData.batchId),
          quantity: Number(formData.quantity),
          dispatchedBy: activeEmployee.id,
          transferredBy: activeEmployee.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to dispatch stock transfer.");
      }

      showToast("Stock transfer dispatched successfully!", "success", "Transfer Dispatched");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || "Failed to dispatch stock transfer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveTransfer = async (transferId: number) => {
    if (!activeEmployee) {
      showToast("Please select an acting employee in topbar.", "warning", "Employee Required");
      return;
    }

    try {
      const res = await fetch(`/api/stock-transfers/${transferId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedBy: activeEmployee.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Failed to receive transfer.", "error", "Receive Failed");
        return;
      }
      showToast(`Stock transfer #${transferId} received into destination location.`, "success", "Transfer Received");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to receive transfer.", "error", "Receive Exception");
    }
  };

  const canDispatchTransfer =
    activeEmployee?.role === "warehouse" || activeEmployee?.locationId != null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock Transfers"
        description="Dispatch and receive inter-branch and central warehouse medication stock transfers"
        action={
          canDispatchTransfer ? (
            <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Dispatch New Transfer
            </Button>
          ) : undefined
        }
      />

      {/* Transfers Table */}
      <Card>
        {loading ? (
          <Loader label="Loading stock transfers..." minHeight="350px" />
        ) : transfers.length === 0 ? (
          <div className="py-[var(--space-xl)] text-center text-[var(--color-text-secondary)]">
            No stock transfers recorded yet.
          </div>
        ) : (
          <Table
            headers={[
              "Transfer ID",
              "Origin Location",
              "Destination Location",
              "Batch ID",
              "Quantity",
              "Status",
              "Dispatched Date",
              "Actions",
            ]}
          >
            {transfers.map((tr) => {
              const isDispatched = tr.status === "in_transit" || tr.status === "dispatched";
              const isDestinationUser =
                activeEmployee?.locationId != null &&
                Number(activeEmployee.locationId) === Number(tr.destinationLocationId);
              const destName = getLocationName(tr.destinationLocationId, tr.destinationLocationName);

              return (
                <TableRow key={tr.id}>
                  <TableCell className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                    TR-{tr.id}
                  </TableCell>
                  <TableCell className="font-semibold text-[var(--color-text-primary)]">
                    {getLocationName(tr.sourceLocationId, tr.sourceLocationName)}
                  </TableCell>
                  <TableCell className="font-semibold text-[var(--color-text-primary)]">
                    {destName}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <span className="bg-[var(--color-surface-subtle)] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-primary)]">
                      {getBatchNumber(tr.batchId, tr.batchNumber)}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-[var(--color-text-primary)]">
                    {tr.quantity ?? 0} Vials
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tr.status === "completed" || tr.status === "received"
                          ? "success"
                          : tr.status === "in_transit" || tr.status === "dispatched"
                          ? "info"
                          : "neutral"
                      }
                    >
                      {tr.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-text-secondary)]">
                    {tr.dispatchedAt ? formatDate(tr.dispatchedAt) : "N/A"}
                  </TableCell>
                  <TableCell>
                    {isDispatched ? (
                      isDestinationUser ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReceiveTransfer(tr.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white !py-1 !px-2.5 text-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Receive Transfer
                        </Button>
                      ) : (
                        <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200/60 inline-block">
                          Awaiting receipt by {destName}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)] italic">Completed</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Dispatch Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispatch Stock Transfer"
        subtitle="Move inventory between central warehouse and pharmacy branches"
        maxWidth="xl"
      >
        <form onSubmit={handleDispatchTransfer} noValidate className="flex flex-col gap-6">
          {actionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Source location (from) <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={locations.map((loc) => ({
                  value: String(loc.id),
                  label: `${loc.name} (${loc.type})`,
                }))}
                value={formData.sourceLocationId}
                onChange={(val) => {
                  const availableBatches = ledgerSummary.filter(
                    (b) => Number(b.locationId) === Number(val)
                  );
                  const newBatchId = availableBatches.length > 0 ? String(availableBatches[0].batchId) : "";
                  setFormData((prev) => ({
                    ...prev,
                    sourceLocationId: val,
                    batchId: newBatchId,
                  }));
                  if (fieldErrors.sourceLocationId) setFieldErrors((prev) => ({ ...prev, sourceLocationId: "" }));
                }}
                error={Boolean(fieldErrors.sourceLocationId)}
              />
              {fieldErrors.sourceLocationId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.sourceLocationId}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Destination location (to) <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={locations.map((loc) => ({
                  value: String(loc.id),
                  label: `${loc.name} (${loc.type})`,
                }))}
                value={formData.destinationLocationId}
                onChange={(val) => {
                  setFormData({ ...formData, destinationLocationId: val });
                  if (fieldErrors.destinationLocationId) setFieldErrors((prev) => ({ ...prev, destinationLocationId: "" }));
                }}
                error={Boolean(fieldErrors.destinationLocationId)}
              />
              {fieldErrors.destinationLocationId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.destinationLocationId}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Medication product <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={products.map((prod) => ({
                  value: String(prod.id),
                  label: prod.name,
                }))}
                value={formData.productId}
                onChange={(val) => {
                  setFormData({ ...formData, productId: val });
                  if (fieldErrors.productId) setFieldErrors((prev) => ({ ...prev, productId: "" }));
                }}
                error={Boolean(fieldErrors.productId)}
              />
              {fieldErrors.productId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.productId}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Available stock batch <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={(() => {
                  const availableBatches = ledgerSummary.filter((b) => {
                    const matchesLocation = !formData.sourceLocationId || Number(b.locationId) === Number(formData.sourceLocationId);
                    const qty = b.usableStock ?? b.availableQuantity ?? 0;
                    return matchesLocation && qty > 0;
                  });

                  if (availableBatches.length === 0) {
                    return [{ value: "", label: "No stock batches available at this location" }];
                  }

                  return availableBatches.map((b) => {
                    const batchNum = b.batchNumber || `Batch #${b.batchId}`;
                    const availQty = b.usableStock ?? b.availableQuantity ?? 0;
                    return {
                      value: String(b.batchId),
                      label: `${batchNum} (Avail: ${availQty} Vials)`,
                    };
                  });
                })()}
                value={formData.batchId}
                onChange={(val) => {
                  setFormData({ ...formData, batchId: val });
                  if (fieldErrors.batchId) setFieldErrors((prev) => ({ ...prev, batchId: "" }));
                }}
                error={Boolean(fieldErrors.batchId)}
              />
              {fieldErrors.batchId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.batchId}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Transfer quantity (vials) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => {
                  setFormData({ ...formData, quantity: e.target.value });
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

          <div
            className="mt-6 pt-5 border-t border-[var(--color-border)] flex items-center justify-end gap-3"
            style={{ marginTop: "24px", paddingTop: "20px" }}
          >
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Dispatch Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
