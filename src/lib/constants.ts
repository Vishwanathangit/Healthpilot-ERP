import { Employee } from "@/types";

export const PRODUCT_DETAILS = {
  name: "Insulin Glargine 100 IU/ml vials",
  sku: "INS-GLA-100",
  unit: "vial",
};

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "emp-001",
    name: "Dr. Sarah Jenkins",
    role: "Pharmacist-in-Charge",
    locationId: "branch-a",
    locationName: "Branch Pharmacy A",
  },
  {
    id: "emp-002",
    name: "Marcus Vance",
    role: "Lead Pharmacy Tech",
    locationId: "branch-b",
    locationName: "Branch Pharmacy B",
  },
  {
    id: "emp-003",
    name: "Elena Rostova",
    role: "Clinical Pharmacist",
    locationId: "branch-c",
    locationName: "Branch Pharmacy C",
  },
  {
    id: "emp-004",
    name: "David Chen",
    role: "Warehouse Inventory Controller",
    locationId: "central-wh",
    locationName: "Central Warehouse",
  },
  {
    id: "emp-005",
    name: "Rachel Green",
    role: "Procurement Specialist",
    locationId: "central-purchasing",
    locationName: "Central Purchasing Team",
  },
];
