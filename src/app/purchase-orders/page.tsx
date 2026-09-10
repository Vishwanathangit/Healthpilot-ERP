"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import { ShoppingCart, PlusCircle, Filter, AlertCircle, FileText, CheckCircle2 } from "lucide-react";

function PurchaseOrdersContent() {
  const { activeEmployee } = useActiveEmployee();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState(() => {
    const param = searchParams.get("poStatus");
    const validStatuses = ["all", "draft", "sent", "open", "partially_received", "completed", "cancelled"];
    return param && validStatuses.includes(param) ? param : "all";
  });

  // Sync state if URL searchParams change
  useEffect(() => {
    const param = searchParams.get("poStatus");
    const validStatuses = ["all", "draft", "sent", "open", "partially_received", "completed", "cancelled"];
    if (param && validStatuses.includes(param)) {
      if (statusFilter !== param) {
        setStatusFilter(param);
      }
    } else if (!param && statusFilter !== "all") {
      setStatusFilter("all");
    }
  }, [searchParams]);

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (newStatus === "all") {
      params.delete("poStatus");
    } else {
      params.set("poStatus", newStatus);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    requisitionId: "",
    supplierId: "",
    deliveryLocationId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    unitPrice: "500.00",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, reqRes, supRes, locRes] = await Promise.all([
        fetch("/api/purchase-orders").then((r) => r.json()),
        fetch("/api/requisitions").then((r) => r.json()),
        fetch("/api/suppliers").then((r) => r.json()),
        fetch("/api/locations").then((r) => r.json()),
      ]);

      if (poRes.success) setPurchaseOrders(poRes.data || []);
      if (reqRes.success) {
        // Filter requisitions that are approved
        const approvedReqs = (reqRes.data || []).filter((r: any) => r.status === "approved");
        setRequisitions(approvedReqs);
        if (approvedReqs.length > 0 && !formData.requisitionId) {
          setFormData((prev) => ({
            ...prev,
            requisitionId: String(approvedReqs[0].id),
            deliveryLocationId: String(approvedReqs[0].locationId),
          }));
        }
      }
      if (supRes.success) {
        setSuppliers(supRes.data || []);
        if (supRes.data?.length > 0 && !formData.supplierId) {
          setFormData((prev) => ({ ...prev, supplierId: String(supRes.data[0].id) }));
        }
      }
      if (locRes.success) {
        setLocations(locRes.data || []);
        if (locRes.data?.length > 0 && !formData.deliveryLocationId) {
          setFormData((prev) => ({ ...prev, deliveryLocationId: String(locRes.data[0].id) }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch PO data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const errs: Record<string, string> = {};
    if (!formData.requisitionId) errs.requisitionId = "Approved requisition is required.";
    if (!formData.supplierId) errs.supplierId = "Supplier vendor is required.";
    if (!formData.deliveryLocationId) errs.deliveryLocationId = "Delivery location is required.";
    if (!formData.unitPrice || Number(formData.unitPrice) < 0) errs.unitPrice = "Valid unit price is required.";
    if (!formData.expectedDeliveryDate) errs.expectedDeliveryDate = "Expected delivery date is required.";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    if (!activeEmployee) {
      setActionError("Please select an acting employee in topbar.");
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);

      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requisitionId: Number(formData.requisitionId),
          supplierId: Number(formData.supplierId),
          deliveryLocationId: Number(formData.deliveryLocationId),
          orderDate: formData.orderDate,
          expectedDeliveryDate: formData.expectedDeliveryDate,
          unitPrice: Number(formData.unitPrice),
          createdBy: activeEmployee.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create Purchase Order.");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || "Failed to create Purchase Order.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSupplierName = (id: number, fallbackName?: string) => {
    return suppliers.find((s) => Number(s.id) === Number(id))?.name || fallbackName || `Supplier #${id}`;
  };

  const getLocationName = (id: number, fallbackName?: string) => {
    return locations.find((l) => Number(l.id) === Number(id))?.name || fallbackName || `Location #${id}`;
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "sent" || statusFilter === "open") {
      return po.status === "sent" || po.status === "open";
    }
    return po.status === statusFilter;
  });

  const poFilterOptions = [
    { id: "all", label: "All Orders" },
    { id: "draft", label: "Draft" },
    { id: "sent", label: "Sent / Open" },
    { id: "partially_received", label: "Partially Received" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Purchase Orders"
        description="Issue and track official procurement purchase orders to external pharmaceutical vendors"
        action={
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Purchase Order
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white border-2 border-slate-300 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <Filter className="w-4 h-4 text-[var(--color-accent)]" />
              <span>PO status:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {poFilterOptions.map((opt) => {
                const isActive = statusFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleFilterChange(opt.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-[var(--color-accent)] text-white border-2 border-[var(--color-accent)] shadow-md ring-2 ring-[var(--color-accent)]/20"
                        : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Showing {filteredPOs.length} of {purchaseOrders.length} purchase orders
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <Card>
        {loading ? (
          <Loader label="Loading purchase orders..." minHeight="350px" />
        ) : filteredPOs.length === 0 ? (
          <div className="py-[var(--space-xl)] text-center text-[var(--color-text-secondary)]">
            No purchase orders found matching this filter.
          </div>
        ) : (
          <Table
            headers={[
              "PO ID",
              "Linked Requisition",
              "Supplier",
              "Delivery Location",
              "Order Date",
              "Expected Delivery",
              "Status",
            ]}
          >
            {filteredPOs.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                  PO-{po.id}
                </TableCell>
                <TableCell className="font-mono text-xs text-[var(--color-text-secondary)]">
                  REQ-{po.requisitionId}
                </TableCell>
                <TableCell className="font-semibold text-[var(--color-text-primary)]">
                  {getSupplierName(po.supplierId, po.supplierName)}
                </TableCell>
                <TableCell className="text-[var(--color-text-primary)] font-medium">
                  {getLocationName(po.deliveryLocationId, po.deliveryLocationName)}
                </TableCell>
                <TableCell className="text-xs text-[var(--color-text-secondary)]">{po.orderDate}</TableCell>
                <TableCell className="text-xs text-[var(--color-text-secondary)]">
                  {po.expectedDeliveryDate || "N/A"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      po.status === "completed"
                        ? "success"
                        : po.status === "sent" || po.status === "partially_received"
                        ? "info"
                        : po.status === "draft"
                        ? "neutral"
                        : "danger"
                    }
                  >
                    {po.status?.replace("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Purchase Order"
        subtitle="Convert an approved internal requisition into an official supplier PO"
        maxWidth="xl"
      >
        <form noValidate onSubmit={handleCreatePO} className="flex flex-col gap-6">
          {actionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Row 1: Approved Requisition Source */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
              Approved requisition source <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={formData.requisitionId}
              onChange={(val) => {
                const req = requisitions.find((r) => String(r.id) === val);
                setFormData({
                  ...formData,
                  requisitionId: val,
                  deliveryLocationId: req ? String(req.locationId) : formData.deliveryLocationId,
                });
                if (fieldErrors.requisitionId) setFieldErrors((prev) => ({ ...prev, requisitionId: "" }));
              }}
              options={
                requisitions.length === 0
                  ? [{ value: "", label: "No Approved Requisitions Available" }]
                  : requisitions.map((req) => ({
                      value: String(req.id),
                      label: `REQ-${req.id} — ${req.quantity} Vials for ${getLocationName(req.locationId, req.locationName)}`,
                    }))
              }
              error={fieldErrors.requisitionId}
            />
            {fieldErrors.requisitionId && (
              <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>{fieldErrors.requisitionId}</span>
              </p>
            )}
          </div>

          {/* Row 2: Supplier Vendor & Destination Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Supplier / pharmaceutical vendor <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={formData.supplierId}
                onChange={(val) => {
                  setFormData({ ...formData, supplierId: val });
                  if (fieldErrors.supplierId) setFieldErrors((prev) => ({ ...prev, supplierId: "" }));
                }}
                options={suppliers.map((sup) => ({ value: String(sup.id), label: sup.name }))}
                error={fieldErrors.supplierId}
              />
              {fieldErrors.supplierId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.supplierId}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Destination delivery location <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={formData.deliveryLocationId}
                onChange={(val) => {
                  setFormData({ ...formData, deliveryLocationId: val });
                  if (fieldErrors.deliveryLocationId) setFieldErrors((prev) => ({ ...prev, deliveryLocationId: "" }));
                }}
                options={locations.map((loc) => ({ value: String(loc.id), label: `${loc.name} (${loc.type})` }))}
                error={fieldErrors.deliveryLocationId}
              />
              {fieldErrors.deliveryLocationId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.deliveryLocationId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Unit Price & Expected Delivery Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Agreed unit price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => {
                  setFormData({ ...formData, unitPrice: e.target.value });
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
                Expected delivery date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => {
                  setFormData({ ...formData, expectedDeliveryDate: e.target.value });
                  if (fieldErrors.expectedDeliveryDate) setFieldErrors((prev) => ({ ...prev, expectedDeliveryDate: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.expectedDeliveryDate ? "border-rose-500 ring-2 ring-rose-500/20" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs cursor-pointer`}
              />
              {fieldErrors.expectedDeliveryDate && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.expectedDeliveryDate}</span>
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
            <Button variant="primary" type="submit" loading={submitting} disabled={requisitions.length === 0}>
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<Loader label="Loading purchase orders..." minHeight="400px" />}>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
