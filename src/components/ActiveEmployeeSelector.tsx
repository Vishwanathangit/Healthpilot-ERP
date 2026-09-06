"use client";

import React from "react";
import { useActiveEmployee } from "./EmployeeContext";
import { UserCheck, Building2, Shield } from "lucide-react";

export function ActiveEmployeeSelector() {
  const { activeEmployee, setActiveEmployee, employees } = useActiveEmployee();

  return (
    <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 text-white rounded-lg px-3 py-1.5 shadow-sm text-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center font-semibold text-xs shrink-0">
          {activeEmployee.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="flex flex-col text-left text-xs">
          <span className="font-semibold text-slate-100 flex items-center gap-1.5">
            {activeEmployee.name}
            <span className="bg-sky-500/20 text-sky-300 text-[10px] px-1.5 py-0.5 rounded font-mono border border-sky-500/30">
              Active
            </span>
          </span>
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            {activeEmployee.locationName} • {activeEmployee.role}
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-slate-700 mx-1" />

      <div className="relative">
        <select
          value={activeEmployee.id}
          onChange={(e) => {
            const selected = employees.find((emp) => emp.id === e.target.value);
            if (selected) setActiveEmployee(selected);
          }}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          title="Switch Active Employee (Audit context)"
        >
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} — {emp.locationName} ({emp.role})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
