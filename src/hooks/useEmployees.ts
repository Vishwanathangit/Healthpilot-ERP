import { useQuery } from "@tanstack/react-query";
import type { Employee } from "@/repositories/employeeRepository";

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch("/api/employees");
  if (!res.ok) {
    throw new Error("Failed to fetch employees.");
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Failed to load employees.");
  }
  return json.data;
}

export function useEmployees() {
  return useQuery<Employee[], Error>({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });
}
