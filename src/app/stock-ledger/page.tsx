"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { formatDate } from "@/lib/utils";
import { BookOpen, Filter, Boxes, ChevronLeft, ChevronRight } from "lucide-react";

function StockLedgerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<"log" | "positions">(() => {
    const param = searchParams.get("tab");
    return param === "log" ? "log" : "positions";
  });

  const [selectedLocation, setSelectedLocation] = useState<string>(() => {
    return searchParams.get("location") || "all";
  });

  const [currentPage, setCurrentPage] = useState<number>(() => {
    const p = searchParams.get("page");
    return p ? Math.max(1, parseInt(p, 10)) : 1;
  });

  const [pageSize, setPageSize] = useState<number>(() => {
    const l = searchParams.get("limit");
    return l ? Math.max(1, parseInt(l, 10)) : 10;
  });

  const [ledgerLogs, setLedgerLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [summary, setSummary] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync with searchParams changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "log" || tabParam === "positions") {
      if (activeTab !== tabParam) setActiveTab(tabParam);
    }

    const locParam = searchParams.get("location");
    if (locParam && selectedLocation !== locParam) {
      setSelectedLocation(locParam);
    } else if (!locParam && selectedLocation !== "all") {
      setSelectedLocation("all");
    }

    const pageParam = searchParams.get("page");
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (!isNaN(parsedPage) && parsedPage !== currentPage) {
        setCurrentPage(parsedPage);
      }
    }

    const limitParam = searchParams.get("limit");
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit !== pageSize) {
        setPageSize(parsedLimit);
      }
    }
  }, [searchParams]);

  const updateQueryParams = (newTab?: string, newLoc?: string, newPage?: number, newLimit?: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    
    const tabVal = newTab !== undefined ? newTab : activeTab;
    if (tabVal === "positions") {
      params.delete("tab");
    } else {
      params.set("tab", tabVal);
    }

    const locVal = newLoc !== undefined ? newLoc : selectedLocation;
    if (locVal === "all") {
      params.delete("location");
    } else {
      params.set("location", locVal);
    }

    const pageVal = newPage !== undefined ? newPage : currentPage;
    if (pageVal === 1) {
      params.delete("page");
    } else {
      params.set("page", String(pageVal));
    }

    const limitVal = newLimit !== undefined ? newLimit : pageSize;
    if (limitVal === 10) {
      params.delete("limit");
    } else {
      params.set("limit", String(limitVal));
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (tab: "positions" | "log") => {
    setActiveTab(tab);
    updateQueryParams(tab, selectedLocation, 1, pageSize);
  };

  const handleLocationChange = (loc: string) => {
    setSelectedLocation(loc);
    setCurrentPage(1);
    updateQueryParams(activeTab, loc, 1, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setCurrentPage(newPage);
    updateQueryParams(activeTab, selectedLocation, newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    updateQueryParams(activeTab, selectedLocation, 1, newSize);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const ledgerUrl = `/api/stock-ledger?page=${currentPage}&limit=${pageSize}${
        selectedLocation !== "all" ? `&locationId=${selectedLocation}` : ""
      }`;

      const [ledgerRes, summaryRes, locRes, prodRes, batchRes] = await Promise.all([
        fetch(ledgerUrl).then((r) => r.json()),
        fetch("/api/stock-ledger/summary").then((r) => r.json()),
        fetch("/api/locations").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/batches").then((r) => r.json()),
      ]);

      if (ledgerRes.success) {
        setLedgerLogs(ledgerRes.data || []);
        if (ledgerRes.pagination) {
          setPagination(ledgerRes.pagination);
        }
      }
      if (summaryRes.success) setSummary(summaryRes.data || []);
      if (locRes.success) setLocations(locRes.data || []);
      if (prodRes.success) setProducts(prodRes.data || []);
      if (batchRes.success) setBatches(batchRes.data || []);
    } catch (err) {
      console.error("Failed to fetch stock ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, selectedLocation]);

  const getLocationName = (id: number, fallbackName?: string) => {
    return locations.find((l) => Number(l.id) === Number(id))?.name || fallbackName || `Location #${id}`;
  };

  const getProductName = (id: number, fallbackName?: string) => {
    return products.find((p) => Number(p.id) === Number(id))?.name || fallbackName || `Product #${id}`;
  };

  const getBatchNumber = (id: number, fallbackNumber?: string) => {
    return batches.find((b) => Number(b.id) === Number(id))?.batchNumber || fallbackNumber || `Batch #${id}`;
  };

  const filteredSummary = summary.filter((s) => {
    if (selectedLocation === "all") return true;
    return String(s.locationId) === selectedLocation;
  });

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Stock Ledger & Positions"
        description="Immutable perpetual inventory audit log and live batch balance tracking across all pharmacy locations"
      />

      {/* Top Filter & Tab Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--color-surface)] p-5 rounded-xl border border-[var(--color-border)] shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTabChange("positions")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "positions"
                ? "bg-[var(--color-accent)] text-white border border-[var(--color-accent)] shadow-2xs"
                : "bg-white text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-slate-50"
            }`}
          >
            <Boxes className="w-4 h-4" />
            Stock Positions Summary
          </button>
          <button
            onClick={() => handleTabChange("log")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "log"
                ? "bg-[var(--color-accent)] text-white border border-[var(--color-accent)] shadow-2xs"
                : "bg-white text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Full Movement Audit Log
          </button>
        </div>

        {/* Location Selector */}
        <div className="flex items-center gap-2.5 text-xs">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
            Location:
          </span>
          <CustomSelect
            value={selectedLocation}
            onChange={(val) => handleLocationChange(val)}
            options={[
              { value: "all", label: "All Locations" },
              ...locations.map((loc) => ({ value: String(loc.id), label: loc.name })),
            ]}
            className="w-48 text-xs"
          />
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "positions" ? (
        <Card header={<span className="font-bold text-slate-900 text-sm">Live Stock Positions by Batch</span>}>
          {loading ? (
            <Loader label="Loading live stock positions..." minHeight="350px" />
          ) : filteredSummary.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-secondary)] font-medium text-sm">
              No stock positions recorded for this location.
            </div>
          ) : (
            <Table
              headers={[
                "Location",
                "Product Name",
                "Batch #",
                "Available Qty",
                "Reserved Qty",
                "Total Stock",
                "Stock Alert Status",
              ]}
            >
              {filteredSummary.map((pos, idx) => {
                const availQty = pos.availableQuantity ?? pos.usableStock ?? 0;
                const isLow = Number(availQty) < 15;
                return (
                  <TableRow key={`pos-row-${pos.locationId}-${pos.batchId}-${idx}`}>
                    <TableCell className="font-semibold text-[var(--color-text-primary)]">
                      {getLocationName(pos.locationId, pos.locationName)}
                    </TableCell>
                    <TableCell className="font-medium text-[var(--color-text-primary)]">
                      {getProductName(pos.productId, pos.productName)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-800">
                        {getBatchNumber(pos.batchId, pos.batchNumber)}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 text-sm">
                      {availQty} Vials
                    </TableCell>
                    <TableCell className="text-[var(--color-text-secondary)] font-medium">
                      {pos.reservedQuantity ?? 0} Vials
                    </TableCell>
                    <TableCell className="font-semibold text-[var(--color-text-secondary)]">
                      {pos.totalQuantity ?? availQty} Vials
                    </TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="warning">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">Normal Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>
          )}
        </Card>
      ) : (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-slate-900 text-sm">Perpetual Stock Movement Ledger Log</span>
              {pagination.total > 0 && (
                <span className="text-xs font-semibold text-slate-500">
                  Total Records: {pagination.total}
                </span>
              )}
            </div>
          }
        >
          {loading ? (
            <Loader label="Loading stock movement audit log..." minHeight="350px" />
          ) : ledgerLogs.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-secondary)] font-medium text-sm">
              No stock movement entries recorded yet.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Table
                headers={[
                  "Entry ID",
                  "Location",
                  "Transaction Type",
                  "Quantity Change",
                  "Reference Document",
                  "Timestamp",
                ]}
              >
                {ledgerLogs.map((entry, idx) => {
                  const isPositive = Number(entry.quantityChange) > 0;
                  return (
                    <TableRow key={`ledger-row-${entry.id}-${idx}`}>
                      <TableCell className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                        LEDGER-{entry.id}
                      </TableCell>
                      <TableCell className="font-semibold text-[var(--color-text-primary)]">
                        {getLocationName(entry.locationId, entry.locationName)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.transactionType?.includes("receipt") ||
                            entry.transactionType?.includes("transfer_in")
                              ? "success"
                              : entry.transactionType?.includes("sale") ||
                                entry.transactionType?.includes("transfer_out")
                              ? "info"
                              : "neutral"
                          }
                        >
                          {entry.transactionType?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`font-mono font-bold ${
                          isPositive ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {isPositive ? `+${entry.quantityChange}` : entry.quantityChange} Vials
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[var(--color-text-secondary)]">
                        {entry.referenceType}: #{entry.referenceId}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        {entry.createdAt ? formatDate(entry.createdAt) : "N/A"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>

              {/* Server-Side Pagination Bar */}
              <div className="pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-4">
                  <span>
                    Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Per page:</span>
                    <CustomSelect
                      value={String(pageSize)}
                      onChange={(val) => handlePageSizeChange(Number(val))}
                      options={[
                        { value: "5", label: "5" },
                        { value: "10", label: "10" },
                        { value: "20", label: "20" },
                        { value: "50", label: "50" },
                      ]}
                      className="w-20 text-xs py-1"
                      direction="up"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={`page-btn-${p}`}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                          p === currentPage
                            ? "bg-[var(--color-accent)] text-white shadow-2xs"
                            : "bg-white border border-[var(--color-border)] text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function StockLedgerPage() {
  return (
    <Suspense fallback={<Loader label="Loading stock ledger..." minHeight="400px" />}>
      <StockLedgerContent />
    </Suspense>
  );
}
