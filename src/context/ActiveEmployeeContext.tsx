"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Employee } from "@/repositories/employeeRepository";

interface ActiveEmployeeContextType {
  activeEmployee: Employee | null;
  setActiveEmployee: (employee: Employee | null) => void;
}

const ActiveEmployeeContext = createContext<ActiveEmployeeContextType | undefined>(
  undefined
);

export function ActiveEmployeeProvider({ children }: { children: ReactNode }) {
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);

  return (
    <ActiveEmployeeContext.Provider value={{ activeEmployee, setActiveEmployee }}>
      {children}
    </ActiveEmployeeContext.Provider>
  );
}

export function useActiveEmployee(): ActiveEmployeeContextType {
  const context = useContext(ActiveEmployeeContext);
  if (!context) {
    throw new Error(
      "useActiveEmployee must be used within an ActiveEmployeeProvider"
    );
  }
  return context;
}
