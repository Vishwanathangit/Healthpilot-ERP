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
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/utils";
import {
  PackageCheck,
  PlusCircle,
  AlertCircle,
  AlertTriangle,
  Edit3,
  History,
  FileCheck,
  UserCheck,
} from "lucide-react";

export default function GoodsReceiptsPage() {
  const { activeEmployee } = useActiveEmployee();
  const { showToast } = useToast();

  const [receipts, setReceipts] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Record GRN Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Form State for Record GRN
  const [recordFormData, setRecordFormData] = useState({
    purchaseOrderId: "",
    supplierDeliveryReference: `DN-${Math.floor(100000 + Math.random() * 900000)}`,
    receivedDate: new Date().toISOString().split("T")[0],
    batchNumber: `BAT-INS-2026-0${Math.floor(1 + Math.random() * 9)}`,
    expiryDate: "2027-12-31",
    physicalQuantity: "100",
    acceptedQuantity: "100",
    damagedQuantity: "0",
    missingQuantity: "0",
  });

  // Line Correction Modal State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<{
    grnId: number;
    line: any;
    effectiveQuantities: any;
  } | null>(null);
  const [correctionFormData, setCorrectionFormData] = useState({
    correctedAcceptedQty: "0",
    correctedDamagedQty: "0",
    correctedMissingQty: "0",
    reason: "",
  });
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [recordFieldErrors, setRecordFieldErrors] = useState<Record<string, string>>({});
  const [correctionFieldErrors, setCorrectionFieldErrors] = useState<Record<string, string>>({});

  // Correction History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{
    grnId: number;
    supplierDeliveryReference: string;
    receivedDate: string;
    receivedBy: number;
    line: any;
    corrections: any[];
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [grRes, poRes, empRes] = await Promise.all([
        fetch("/api/goods-receipts").then((r) => r.json()),
        fetch("/api/purchase-orders").then((r) => r.json()),
        fetch("/api/employees").then((r) => r.json()),
      ]);

      if (poRes.success) {
        setPurchaseOrders(poRes.data || []);
        if (poRes.data?.length > 0 && !recordFormData.purchaseOrderId) {
          setRecordFormData((prev) => ({ ...prev, purchaseOrderId: String(poRes.data[0].id) }));
        }
      }

      if (empRes.success) {
        setEmployees(empRes.data || []);
      }

      if (grRes.success && Array.isArray(grRes.data)) {
        // Enrich each receipt with full line & correction details from /api/goods-receipts/[id]
        const enrichedReceipts = await Promise.all(
          grRes.data.map(async (gr: any) => {
            try {
              const detailRes = await fetch(`/api/goods-receipts/${gr.id}`).then((r) => r.json());
              if (detailRes.success && detailRes.data) {
                return {
                  ...gr,
                  lines: detailRes.data.lines || [],
                };
              }
            } catch (e) {
              console.error(`Failed to load details for GRN #${gr.id}`, e);
            }
            return { ...gr, lines: [] };
          })
        );
        setReceipts(enrichedReceipts);
      }
    } catch (err) {
      console.error("Failed to fetch GRN data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEmployeeName = (empId: number) => {
    const found = employees.find((e) => Number(e.id) === Number(empId));
    return found ? found.name : `Employee #${empId}`;
  };

  // Handler: Create new GRN
  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) {
      setRecordError("Please select an acting employee in topbar.");
      return;
    }

    try {
      setSubmitting(true);
      setRecordError(null);

      const phys = Number(recordFormData.physicalQuantity);
      const acc = Number(recordFormData.acceptedQuantity);
      const dam = Number(recordFormData.damagedQuantity);
      const miss = Number(recordFormData.missingQuantity);

      if (phys !== acc + dam + miss) {
        throw new Error(
          `Physical quantity (${phys}) must equal Accepted (${acc}) + Damaged (${dam}) + Missing (${miss}).`
        );
      }

      const res = await fetch("/api/goods-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseOrderId: Number(recordFormData.purchaseOrderId),
          supplierDeliveryReference: recordFormData.supplierDeliveryReference,
          receivedDate: recordFormData.receivedDate,
          receivedBy: activeEmployee.id,
          batchNumber: recordFormData.batchNumber,
          expiryDate: recordFormData.expiryDate,
          physicalQuantity: phys,
          acceptedQuantity: acc,
          damagedQuantity: dam,
          missingQuantity: miss,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to record Goods Receipt.");
      }

      showToast("Goods Receipt recorded successfully!", "success", "GRN Created");
      setIsRecordModalOpen(false);
      fetchData();
    } catch (err: any) {
      setRecordError(err.message || "Failed to record Goods Receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Correction Modal
  const openCorrectionModal = (grn: any, enrichedLine: any) => {
    const line = enrichedLine.line || enrichedLine;
    const eff = enrichedLine.effectiveQuantities || {
      acceptedQuantity: line.acceptedQuantity,
      damagedQuantity: line.damagedQuantity,
      missingQuantity: line.missingQuantity,
    };

    setCorrectionTarget({
      grnId: grn.id,
      line,
      effectiveQuantities: eff,
    });
    setCorrectionFormData({
      correctedAcceptedQty: String(eff.acceptedQuantity),
      correctedDamagedQty: String(eff.damagedQuantity),
      correctedMissingQty: String(eff.missingQuantity),
      reason: "",
    });
    setCorrectionError(null);
    setCorrectionFieldErrors({});
    setIsCorrectionModalOpen(true);
  };

  // Handler: Submit Line Correction
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget) return;

    const fieldErrs: Record<string, string> = {};
    if (!correctionFormData.reason.trim()) {
      fieldErrs.reason = "Reason for correction is required.";
    }

    if (Object.keys(fieldErrs).length > 0) {
      setCorrectionFieldErrors(fieldErrs);
      return;
    }
    setCorrectionFieldErrors({});

    if (!activeEmployee) {
      setCorrectionError("Please select an acting employee in the topbar.");
      return;
    }

    const { line } = correctionTarget;
    const acc = Number(correctionFormData.correctedAcceptedQty);
    const dam = Number(correctionFormData.correctedDamagedQty);
    const miss = Number(correctionFormData.correctedMissingQty);
    const phys = Number(line.physicalQuantity);

    if (acc + dam + miss !== phys) {
      setCorrectionError(
        `Sum of Accepted (${acc}) + Damaged (${dam}) + Missing (${miss}) = ${acc + dam + miss}, which must equal Physical Quantity (${phys}).`
      );
      return;
    }

    try {
      setCorrectionSubmitting(true);
      setCorrectionError(null);

      const res = await fetch(`/api/goods-receipts/lines/${line.id}/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctedAcceptedQty: acc,
          correctedDamagedQty: dam,
          correctedMissingQty: miss,
          correctedBy: activeEmployee.id,
          reason: correctionFormData.reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to submit GRN line correction.");
      }

      showToast(
        `GRN Line #${line.id} corrected to ${acc} Accepted, ${dam} Damaged, ${miss} Missing.`,
        "success",
        "Line Correction Saved"
      );
      setIsCorrectionModalOpen(false);
      fetchData();
    } catch (err: any) {
      setCorrectionError(err.message || "Failed to submit line correction.");
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  // Open Correction History Modal
  const openHistoryModal = (grn: any, enrichedLine: any) => {
    setHistoryTarget({
      grnId: grn.id,
      supplierDeliveryReference: grn.supplierDeliveryReference,
      receivedDate: grn.receivedDate,
      receivedBy: grn.receivedBy,
      line: enrichedLine.line,
      corrections: enrichedLine.corrections || [],
    });
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Goods Receipts (GRN)"
        description="Inspect physical pharmaceutical shipments, log batch numbers, record discrepancy splits, and correct receiving errors with full audit trail"
        action={
          <Button variant="primary" size="md" onClick={() => setIsRecordModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Receive Goods (Record GRN)
          </Button>
        }
      />

      {/* Receipts Table */}
      <Card>
        {loading ? (
          <Loader label="Loading Goods Receipts & line inspection data..." minHeight="350px" />
        ) : receipts.length === 0 ? (
          <div className="py-[var(--space-xl)] text-center text-[var(--color-text-secondary)]">
            No Goods Receipt Notes (GRN) recorded yet.
          </div>
        ) : (
          <Table
            headers={[
              "GRN ID",
              "Linked PO",
              "Delivery Ref",
              "Received Date",
              "Physical Qty",
              "Effective Accepted",
              "Damaged / Missing",
              "Status / Audit",
              "Actions",
            ]}
          >
            {receipts.map((gr) => {
              const enrichedLine = gr.lines && gr.lines.length > 0 ? gr.lines[0] : null;
              const line = enrichedLine?.line;
              const eff = enrichedLine?.effectiveQuantities || {
                acceptedQuantity: gr.acceptedQuantity,
                damagedQuantity: gr.damagedQuantity,
                missingQuantity: gr.missingQuantity,
              };
              const corrections = enrichedLine?.corrections || [];
              const hasCorrections = corrections.length > 0;

              const physicalQty = line ? line.physicalQuantity : gr.physicalQuantity;
              const acceptedQty = eff.acceptedQuantity;
              const damagedQty = eff.damagedQuantity;
              const missingQty = eff.missingQuantity;

              const hasDiscrepancy =
                Number(damagedQty || 0) > 0 ||
                Number(missingQty || 0) > 0 ||
                Number(physicalQty) !== Number(acceptedQty);

              return (
                <TableRow key={gr.id}>
                  <TableCell className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                    GRN-{gr.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[var(--color-text-secondary)]">
                    PO-{gr.purchaseOrderId}
                  </TableCell>
                  <TableCell className="font-semibold text-[var(--color-text-primary)]">
                    {gr.supplierDeliveryReference}
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-text-secondary)]">{gr.receivedDate}</TableCell>
                  <TableCell className="font-medium text-[var(--color-text-primary)]">
                    {physicalQty} Vials
                  </TableCell>
                  <TableCell className="font-bold text-emerald-700">
                    {acceptedQty} Vials
                  </TableCell>
                  <TableCell>
                    {hasDiscrepancy ? (
                      <span className="font-semibold text-amber-700 text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Dam: {damagedQty} | Miss: {missingQty}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {hasCorrections ? (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <History className="w-3 h-3" /> Corrected ({corrections.length})
                        </Badge>
                      ) : hasDiscrepancy ? (
                        <Badge variant="warning">Variance Recorded</Badge>
                      ) : (
                        <Badge variant="success">Passed Inspection</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {enrichedLine && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openCorrectionModal(gr, enrichedLine)}
                            className="!py-1 !px-2.5 text-xs text-teal-800 border-teal-200 hover:bg-teal-50"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1 text-teal-600" />
                            Correct Line
                          </Button>

                          {hasCorrections && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openHistoryModal(gr, enrichedLine)}
                              className="!py-1 !px-2.5 text-xs text-slate-700 hover:bg-slate-100"
                            >
                              <History className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              View History
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Modal 1: Record New GRN */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Goods Receipt Note (GRN)"
        subtitle="Log physical delivery details, batch number, expiry date, and inspect for damaged/missing units"
        maxWidth="xl"
      >
        <form noValidate onSubmit={handleCreateGRN} className="flex flex-col gap-6">
          {recordError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{recordError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Target purchase order <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={recordFormData.purchaseOrderId}
                onChange={(val) =>
                  setRecordFormData({ ...recordFormData, purchaseOrderId: val })
                }
                options={purchaseOrders.map((po) => ({
                  value: String(po.id),
                  label: `PO-${po.id} (${po.supplierName || `Supplier #${po.supplierId}`})`,
                }))}
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Supplier delivery / note ref <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={recordFormData.supplierDeliveryReference}
                onChange={(e) =>
                  setRecordFormData({ ...recordFormData, supplierDeliveryReference: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Received date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={recordFormData.receivedDate}
                onChange={(e) => setRecordFormData({ ...recordFormData, receivedDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs cursor-pointer"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Batch number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={recordFormData.batchNumber}
                onChange={(e) => setRecordFormData({ ...recordFormData, batchNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Expiry date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={recordFormData.expiryDate}
                onChange={(e) => setRecordFormData({ ...recordFormData, expiryDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          {/* Quantities breakdown */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800">
              Physical stock inspection & discrepancy breakdown
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Physical Delivered
                </label>
                <input
                  type="number"
                  min="0"
                  value={recordFormData.physicalQuantity}
                  onChange={(e) =>
                    setRecordFormData({ ...recordFormData, physicalQuantity: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                  Accepted (Good)
                </label>
                <input
                  type="number"
                  min="0"
                  value={recordFormData.acceptedQuantity}
                  onChange={(e) =>
                    setRecordFormData({ ...recordFormData, acceptedQuantity: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50 text-sm font-bold text-emerald-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                  Damaged Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={recordFormData.damagedQuantity}
                  onChange={(e) =>
                    setRecordFormData({ ...recordFormData, damagedQuantity: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-amber-300 bg-amber-50/50 text-sm font-bold text-amber-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-red-700 mb-1">
                  Missing / Short
                </label>
                <input
                  type="number"
                  min="0"
                  value={recordFormData.missingQuantity}
                  onChange={(e) =>
                    setRecordFormData({ ...recordFormData, missingQuantity: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-red-300 bg-red-50/50 text-sm font-bold text-red-900"
                />
              </div>
            </div>
          </div>

          <div
            className="mt-6 pt-5 border-t border-[var(--color-border)] flex items-center justify-end gap-3"
            style={{ marginTop: "24px", paddingTop: "20px" }}
          >
            <Button variant="secondary" type="button" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Confirm & Save GRN
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Correct Goods Receipt Line */}
      {correctionTarget && (
        <Modal
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
          title={`Correct Goods Receipt Line (GRN-${correctionTarget.grnId})`}
          subtitle="Adjust receiving quantities without deleting the original inspection log. Full audit trail is preserved."
          maxWidth="lg"
        >
          <form noValidate onSubmit={handleSubmitCorrection} className="flex flex-col gap-5">
            {correctionError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{correctionError}</span>
              </div>
            )}

            {/* Read-Only Context Banner: Target Line */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Target Line #{correctionTarget.line.id} (GRN-{correctionTarget.grnId})
                </span>
                <span className="font-semibold text-slate-600">
                  Physical Delivered:{" "}
                  <strong className="text-slate-900 font-bold">
                    {correctionTarget.line.physicalQuantity} Vials
                  </strong>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 font-mono bg-white p-3 rounded-lg border border-slate-200 text-[11px]">
                <div>Current Accepted: <strong className="text-emerald-700">{correctionTarget.effectiveQuantities.acceptedQuantity}</strong></div>
                <div>Current Damaged: <strong className="text-amber-700">{correctionTarget.effectiveQuantities.damagedQuantity}</strong></div>
                <div>Current Missing: <strong className="text-red-700">{correctionTarget.effectiveQuantities.missingQuantity}</strong></div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                <UserCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>
                  Corrected by:{" "}
                  <strong className="text-slate-800">
                    {activeEmployee ? activeEmployee.name : "Not selected"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Correction Form Inputs */}
            <div>
              <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
                Enter Corrected Quantity Breakdown
              </h4>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1 uppercase tracking-wide">
                    Corrected Accepted
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={correctionFormData.correctedAcceptedQty}
                    onChange={(e) =>
                      setCorrectionFormData({
                        ...correctionFormData,
                        correctedAcceptedQty: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/50 text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-700 mb-1 uppercase tracking-wide">
                    Corrected Damaged
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={correctionFormData.correctedDamagedQty}
                    onChange={(e) =>
                      setCorrectionFormData({
                        ...correctionFormData,
                        correctedDamagedQty: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50/50 text-sm font-bold text-amber-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-red-700 mb-1 uppercase tracking-wide">
                    Corrected Missing
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={correctionFormData.correctedMissingQty}
                    onChange={(e) =>
                      setCorrectionFormData({
                        ...correctionFormData,
                        correctedMissingQty: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-red-300 bg-red-50/50 text-sm font-bold text-red-900 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Running Sum Validation Badge */}
              {(() => {
                const acc = Number(correctionFormData.correctedAcceptedQty || 0);
                const dam = Number(correctionFormData.correctedDamagedQty || 0);
                const miss = Number(correctionFormData.correctedMissingQty || 0);
                const sum = acc + dam + miss;
                const phys = Number(correctionTarget.line.physicalQuantity);
                const isValid = sum === phys;

                return (
                  <div
                    className={`mt-4 p-3 px-4 rounded-xl border text-xs flex items-center justify-between ${
                      isValid
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-amber-50 border-amber-300 text-amber-900"
                    }`}
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      {isValid ? (
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      Calculated Total: {sum} / {phys} Vials
                    </span>
                    <span className="font-bold">
                      {isValid ? "✓ Equals Physical Delivered" : `Difference: ${sum - phys} Vials`}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
                Reason for Correction <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={correctionFormData.reason}
                onChange={(e) => {
                  setCorrectionFormData({ ...correctionFormData, reason: e.target.value });
                  if (correctionFieldErrors.reason) {
                    setCorrectionFieldErrors((prev) => ({ ...prev, reason: "" }));
                  }
                }}
                placeholder="Specify reason (e.g. Re-inspection of cold-chain temperature log, unit count error, vendor credit agreement)..."
                className={`w-full px-4 py-3 rounded-xl border ${
                  correctionFieldErrors.reason
                    ? "border-rose-500 ring-2 ring-rose-500/20"
                    : "border-[var(--color-border)]"
                } bg-[var(--color-surface)] text-[var(--color-text-primary)] text-xs font-semibold focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition-all shadow-2xs`}
              />
              {correctionFieldErrors.reason && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{correctionFieldErrors.reason}</span>
                </p>
              )}
            </div>

            <div
              className="mt-6 pt-5 border-t border-[var(--color-border)] flex items-center justify-end gap-3"
              style={{ marginTop: "24px", paddingTop: "20px" }}
            >
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsCorrectionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={correctionSubmitting}
                disabled={
                  Number(correctionFormData.correctedAcceptedQty || 0) +
                    Number(correctionFormData.correctedDamagedQty || 0) +
                    Number(correctionFormData.correctedMissingQty || 0) !==
                    Number(correctionTarget.line.physicalQuantity)
                }
              >
                Submit Correction
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 3: View Correction History Audit Trail */}
      {historyTarget && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Correction History Audit Trail — Line #${historyTarget.line.id} (GRN-${historyTarget.grnId})`}
          subtitle={`Delivery Ref: ${historyTarget.supplierDeliveryReference} • Received Date: ${historyTarget.receivedDate}`}
          maxWidth="lg"
        >
          <div className="flex flex-col gap-5">
            {/* Summary Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs">
              <span className="font-semibold text-slate-700">
                Physical Delivered:{" "}
                <strong className="text-slate-900">{historyTarget.line.physicalQuantity} Vials</strong>
              </span>
              <span className="text-slate-500">
                Total Audit Entries:{" "}
                <strong className="text-slate-900 font-bold">
                  {historyTarget.corrections.length + 1}
                </strong>
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto pr-1 flex flex-col gap-5">
              {/* Entry 0: Original Receiving Entry */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative pl-8 flex flex-col gap-3 shadow-2xs">
                <div className="absolute left-3 top-5 w-2.5 h-2.5 rounded-full bg-slate-400" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Original Inspection Entry
                    <Badge variant="neutral">Initial Log</Badge>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {historyTarget.receivedDate}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 font-mono bg-white p-3 rounded-lg text-[11px] border border-slate-200">
                  <div>Accepted: <strong className="text-emerald-700">{historyTarget.line.acceptedQuantity}</strong></div>
                  <div>Damaged: <strong className="text-amber-700">{historyTarget.line.damagedQuantity}</strong></div>
                  <div>Missing: <strong className="text-red-700">{historyTarget.line.missingQuantity}</strong></div>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Recorded by:{" "}
                  <strong className="text-slate-700">
                    {getEmployeeName(historyTarget.receivedBy)}
                  </strong>
                </p>
              </div>

              {/* Entries 1..N: Corrections in Chronological Order */}
              {historyTarget.corrections.length > 0 && (
                <div className="flex flex-col gap-4">
                  {historyTarget.corrections.map((corr: any, idx: number) => {
                    const prev =
                      idx === 0
                        ? {
                            accepted: historyTarget.line.acceptedQuantity,
                            damaged: historyTarget.line.damagedQuantity,
                            missing: historyTarget.line.missingQuantity,
                          }
                        : {
                            accepted: historyTarget.corrections[idx - 1].correctedAcceptedQty,
                            damaged: historyTarget.corrections[idx - 1].correctedDamagedQty,
                            missing: historyTarget.corrections[idx - 1].correctedMissingQty,
                          };

                    return (
                      <div
                        key={corr.id || idx}
                        className="p-4 bg-amber-50/40 border border-amber-200/70 rounded-xl relative pl-8 flex flex-col gap-3 shadow-2xs"
                      >
                        <div className="absolute left-3 top-5 w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            Correction #{idx + 1}
                            <Badge variant="warning">Audit Update</Badge>
                          </span>
                          <span className="text-[11px] text-amber-800 font-medium">
                            {corr.createdAt ? formatDate(corr.createdAt) : "Recent"}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 font-mono bg-white p-3 rounded-lg text-[11px] border border-amber-200/60">
                          <div>
                            Accepted: <span className="text-slate-400 line-through mr-1">{prev.accepted}</span> →{" "}
                            <strong className="text-emerald-700">{corr.correctedAcceptedQty}</strong>
                          </div>
                          <div>
                            Damaged: <span className="text-slate-400 line-through mr-1">{prev.damaged}</span> →{" "}
                            <strong className="text-amber-700">{corr.correctedDamagedQty}</strong>
                          </div>
                          <div>
                            Missing: <span className="text-slate-400 line-through mr-1">{prev.missing}</span> →{" "}
                            <strong className="text-red-700">{corr.correctedMissingQty}</strong>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-700 bg-white/80 p-3 rounded-lg border border-amber-100 font-medium italic">
                          Reason: "{corr.reason}"
                        </p>

                        <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                          <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Corrected by:{" "}
                          <strong className="text-slate-800">{getEmployeeName(corr.correctedBy)}</strong>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="mt-6 pt-5 border-t border-slate-200 flex justify-end"
              style={{ marginTop: "24px", paddingTop: "20px" }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Close Audit History
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

