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
import { useActiveEmployee } from "@/context/ActiveEmployeeContext";
import { useToast } from "@/context/ToastContext";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  PlusCircle,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface LocationOption {
  id: number;
  name: string;
  type: string;
}

interface ProductOption {
  id: number;
  name: string;
  unit: string;
  purchasePrice: string;
}

interface RequisitionItem {
  id: number;
  locationId: number;
  locationName?: string;
  productId: number;
  productName?: string;
  quantity: number;
  requiredDate: string;
  status: string;
}

const getDefaultRequiredDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
};

function RequisitionsContent() {
  const { activeEmployee } = useActiveEmployee();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [requisitions, setRequisitions] = useState<RequisitionItem[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  const statusParam = searchParams.get("status");
  const validStatuses = ["all", "pending_approval", "approved", "rejected", "fulfilled"];
  const statusFilter = statusParam && validStatuses.includes(statusParam) ? statusParam : "all";

  const handleFilterChange = (newStatus: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (newStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", newStatus);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    locationId: "",
    productId: "",
    quantity: "100",
    requiredDate: getDefaultRequiredDate(),
    reason: "Monthly pharmacy stock replenishment",
  });

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [reqRes, locRes, prodRes] = await Promise.all([
          fetch("/api/requisitions").then((r) => r.json()),
          fetch("/api/locations").then((r) => r.json()),
          fetch("/api/products").then((r) => r.json()),
        ]);

        if (ignore) return;

        if (reqRes.success) setRequisitions(reqRes.data || []);
        if (locRes.success && Array.isArray(locRes.data)) {
          setLocations(locRes.data);
          if (locRes.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              locationId: prev.locationId || String(locRes.data[0].id),
            }));
          }
        }
        if (prodRes.success && Array.isArray(prodRes.data)) {
          setProducts(prodRes.data);
          if (prodRes.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              productId: prev.productId || String(prodRes.data[0].id),
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load requisitions data", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, locRes, prodRes] = await Promise.all([
        fetch("/api/requisitions").then((r) => r.json()),
        fetch("/api/locations").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
      ]);

      if (reqRes.success) setRequisitions(reqRes.data || []);
      if (locRes.success && Array.isArray(locRes.data)) setLocations(locRes.data);
      if (prodRes.success && Array.isArray(prodRes.data)) setProducts(prodRes.data);
    } catch (err) {
      console.error("Failed to reload requisitions data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const errs: Record<string, string> = {};
    if (!formData.locationId) errs.locationId = "Requesting branch location is required.";
    if (!formData.productId) errs.productId = "Medication product is required.";
    if (!formData.quantity || Number(formData.quantity) <= 0) errs.quantity = "Please enter a valid requested quantity.";
    if (!formData.requiredDate) errs.requiredDate = "Required delivery date is required.";
    if (!formData.reason.trim()) errs.reason = "Reason for requisition is required.";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    if (!activeEmployee) {
      setActionError("Please select an acting employee in the top bar before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        locationId: Number(formData.locationId),
        productId: Number(formData.productId),
        quantity: Number(formData.quantity),
        requiredDate: formData.requiredDate,
        requestedBy: activeEmployee.id,
        reason: formData.reason,
      };

      const res = await fetch("/api/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create requisition.");
      }

      showToast("Stock Requisition created successfully!", "success", "Requisition Created");
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create requisition.";
      setActionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!activeEmployee) {
      showToast("Please select an acting employee in the topbar.", "warning", "Employee Required");
      return;
    }
    try {
      const res = await fetch(`/api/requisitions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: activeEmployee.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Approval failed.", "error", "Approval Error");
        return;
      }
      showToast(`Requisition #${id} approved successfully!`, "success", "Requisition Approved");
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Approval failed.";
      showToast(message, "error", "Approval Exception");
    }
  };

  const handleReject = async (id: number) => {
    if (!activeEmployee) {
      showToast("Please select an acting employee in the topbar.", "warning", "Employee Required");
      return;
    }
    try {
      const res = await fetch(`/api/requisitions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedBy: activeEmployee.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Rejection failed.", "error", "Rejection Error");
        return;
      }
      showToast(`Requisition #${id} rejected.`, "info", "Requisition Rejected");
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Rejection failed.";
      showToast(message, "error", "Rejection Exception");
    }
  };

  const getLocationName = (id: number, fallbackName?: string) => {
    return locations.find((l) => Number(l.id) === Number(id))?.name || fallbackName || `Location #${id}`;
  };

  const getProductName = (id: number, fallbackName?: string) => {
    return products.find((p) => Number(p.id) === Number(id))?.name || fallbackName || `Product #${id}`;
  };

  const filteredRequisitions = requisitions.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const filterOptions = [
    { id: "all", label: "All Requisitions" },
    { id: "pending_approval", label: "Pending Approval" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "fulfilled", label: "Fulfilled" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock Requisitions"
        description="Manage internal stock requests from pharmacy branches to central distribution"
        action={
          <div className="pr-4">
            <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              New Requisition
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-surface border border-(--color-border) rounded-lg p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter by status:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {filterOptions.map((opt) => {
                const isActive = statusFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleFilterChange(opt.id)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent text-white border border-accent shadow-xs font-semibold"
                        : "bg-surface text-text-secondary border border-(--color-border) hover:bg-surface-subtle hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-text-secondary font-medium px-3 py-1.5 rounded-lg border border-(--color-border)">
            Showing {filteredRequisitions.length} of {requisitions.length} requisitions
          </div>
        </div>
      </div>

      {/* Requisitions List Table */}
      <Card>
        {loading ? (
          <Loader label="Loading requisitions..." minHeight="350px" />
        ) : filteredRequisitions.length === 0 ? (
          <div className="py-(--space-xl) text-center text-text-secondary">
            No stock requisitions found for this filter.
          </div>
        ) : (
          <Table
            headers={[
              "Req ID",
              "Location",
              "Requested Product",
              "Quantity",
              "Required Date",
              "Status",
              "Actions",
            ]}
          >
            {filteredRequisitions.map((req) => {
              const isPending = req.status === "pending" || req.status === "pending_approval";
              const isPurchasingUser = activeEmployee?.role === "purchasing";

              return (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-xs font-bold text-text-primary">
                    REQ-{req.id}
                  </TableCell>
                  <TableCell className="font-semibold text-text-primary">
                    {getLocationName(req.locationId, req.locationName)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-text-primary">
                      {getProductName(req.productId, req.productName)}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-text-primary">
                    {req.quantity ?? 0} Vials
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    {req.requiredDate}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        req.status === "approved"
                          ? "success"
                          : req.status === "pending" || req.status === "pending_approval"
                          ? "warning"
                          : req.status === "rejected"
                          ? "danger"
                          : "neutral"
                      }
                    >
                      {req.status?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isPending ? (
                      isPurchasingUser ? (
                        <div className="flex items-center gap-(--space-sm)">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(req.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-1! px-2.5! text-xs cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(req.id)}
                            className="py-1! px-2.5! text-xs cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-800 font-medium bg-amber-50/80 px-2.5 py-1 rounded border border-amber-200 inline-block">
                          Awaiting purchasing review
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-text-muted italic">No action needed</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Create Requisition Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Stock Requisition"
        subtitle="Submit a formal stock request from a pharmacy branch to the central warehouse"
        maxWidth="xl"
      >
        <form noValidate onSubmit={handleCreateRequisition} className="flex flex-col gap-6">
          {actionError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wide">
                Requesting location / branch
              </label>
              <CustomSelect
                options={locations.map((loc) => ({
                  value: loc.id,
                  label: `${loc.name} (${loc.type})`,
                }))}
                value={formData.locationId}
                onChange={(val) => {
                  setFormData({ ...formData, locationId: val });
                  if (fieldErrors.locationId) setFieldErrors((prev) => ({ ...prev, locationId: "" }));
                }}
                error={Boolean(fieldErrors.locationId)}
              />
              {fieldErrors.locationId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.locationId}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wide">
                Medication product
              </label>
              <CustomSelect
                options={products.map((prod) => ({
                  value: prod.id,
                  label: `${prod.name} (${prod.unit}) - ₹${prod.purchasePrice}`,
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wide">
                Requested quantity (vials)
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
                  fieldErrors.quantity ? "border-rose-500 ring-2 ring-rose-500/20" : "border-(--color-border)"
                } bg-surface text-text-primary font-semibold text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none transition-all shadow-2xs`}
              />
              {fieldErrors.quantity && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.quantity}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wide">
                Required delivery date
              </label>
              <input
                type="date"
                value={formData.requiredDate}
                onChange={(e) => {
                  setFormData({ ...formData, requiredDate: e.target.value });
                  if (fieldErrors.requiredDate) setFieldErrors((prev) => ({ ...prev, requiredDate: "" }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.requiredDate ? "border-rose-500 ring-2 ring-rose-500/20" : "border-(--color-border)"
                } bg-surface text-text-primary font-semibold text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none transition-all shadow-2xs cursor-pointer`}
              />
              {fieldErrors.requiredDate && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{fieldErrors.requiredDate}</span>
                </p>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wide">
              Reason / justification
            </label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => {
                setFormData({ ...formData, reason: e.target.value });
                if (fieldErrors.reason) setFieldErrors((prev) => ({ ...prev, reason: "" }));
              }}
              className={`w-full px-4 py-3 rounded-xl border ${
                fieldErrors.reason ? "border-rose-500 ring-2 ring-rose-500/20" : "border-(--color-border)"
              } bg-surface text-text-primary font-semibold text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none transition-all shadow-2xs`}
            />
            {fieldErrors.reason && (
              <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>{fieldErrors.reason}</span>
              </p>
            )}
          </div>

          <div 
            className="mt-6 pt-5 border-t border-(--color-border) flex items-center justify-end gap-3"
            style={{ marginTop: "24px", paddingTop: "20px" }}
          >
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Submit Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function RequisitionsPage() {
  return (
    <Suspense fallback={<Loader label="Loading requisitions..." minHeight="400px" />}>
      <RequisitionsContent />
    </Suspense>
  );
}
