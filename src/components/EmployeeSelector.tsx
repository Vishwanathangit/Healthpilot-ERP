"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEmployees } from "@/hooks/useEmployees";
import { useActiveEmployee } from "@/context/ActiveEmployeeContext";
import { ChevronDown, ChevronUp, UserCheck, Check } from "lucide-react";

function EmployeeSelectorContent() {
  const { data: employees, isLoading, isError } = useEmployees();
  const { activeEmployee, setActiveEmployee } = useActiveEmployee();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Sync active employee from URL query param `?actingAs=<id>` on load / URL change
  useEffect(() => {
    if (!employees || employees.length === 0) return;

    const actingAsParam = searchParams.get("actingAs");

    if (actingAsParam) {
      const matched = employees.find((e) => String(e.id) === actingAsParam);
      if (matched && activeEmployee?.id !== matched.id) {
        setActiveEmployee(matched);
      }
    } else if (!activeEmployee) {
      // Fallback default: select first employee and update URL
      const defaultEmp = employees[0];
      setActiveEmployee(defaultEmp);

      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("actingAs", String(defaultEmp.id));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [employees, searchParams, activeEmployee, setActiveEmployee, router, pathname]);

  // Handle manual selection from dropdown
  const handleSelectEmployee = (emp: any) => {
    setActiveEmployee(emp);
    setIsOpen(false);

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("actingAs", String(emp.id));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <UserCheck className="w-4 h-4 text-accent animate-pulse" />
        <span>Acting as:</span>
        <span className="font-medium animate-pulse">Loading personas...</span>
      </div>
    );
  }

  if (isError || !employees) {
    return (
      <div className="text-xs text-danger font-medium flex items-center gap-1">
        <span>Failed to load employee personas</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 relative" ref={containerRef}>
      <span className="text-xs font-medium text-text-secondary whitespace-nowrap flex items-center gap-1.5 select-none">
        <UserCheck className="w-4 h-4 text-accent" />
        <span>Acting as:</span>
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center justify-between gap-3 pl-3 pr-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer select-none ${
            isOpen
              ? "border-accent bg-white text-accent shadow-sm ring-2 ring-accent/15"
              : "border-(--color-border) bg-surface text-text-primary hover:border-accent hover:bg-surface-subtle"
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate max-w-50">
            {activeEmployee
              ? `${activeEmployee.name} (${activeEmployee.role.replace(/_/g, " ")})`
              : "Select Employee..."}
          </span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform duration-200 ease-in-out ${
              isOpen ? "rotate-180 text-accent" : "text-text-muted"
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-72 bg-white border border-(--color-border) rounded-md shadow-xl z-50 py-1 divide-y divide-border-subtle">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-surface-subtle">
              Switch Employee Persona
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {employees.map((emp) => {
                const isSelected = activeEmployee?.id === emp.id;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelectEmployee(emp)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-accent-light text-accent font-semibold"
                        : "text-text-primary hover:bg-surface-subtle font-medium"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-500 capitalize">{emp.role.replace(/_/g, " ")}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmployeeSelector() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <UserCheck className="w-4 h-4 text-accent animate-pulse" />
          <span>Acting as...</span>
        </div>
      }
    >
      <EmployeeSelectorContent />
    </Suspense>
  );
}
