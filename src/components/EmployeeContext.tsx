"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Employee } from "@/types";
import { MOCK_EMPLOYEES } from "@/lib/constants";

interface EmployeeContextType {
  activeEmployee: Employee;
  setActiveEmployee: (employee: Employee) => void;
  employees: Employee[];
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "healthpilot_active_employee_id";

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [activeEmployee, setActiveEmployeeState] = useState<Employee>(MOCK_EMPLOYEES[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedId = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedId) {
        const found = MOCK_EMPLOYEES.find((e) => e.id === savedId);
        if (found) {
          setActiveEmployeeState(found);
        }
      }
    } catch {
      // localStorage may fail in restricted environments
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setActiveEmployee = (emp: Employee) => {
    setActiveEmployeeState(emp);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, emp.id);
    } catch {
      // ignore
    }
  };

  return (
    <EmployeeContext.Provider value={{ activeEmployee, setActiveEmployee, employees: MOCK_EMPLOYEES }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useActiveEmployee() {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error("useActiveEmployee must be used within an EmployeeProvider");
  }
  return context;
}
