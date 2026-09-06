// Shared TypeScript types & interfaces

export type LocationType = "CENTRAL_WAREHOUSE" | "BRANCH_PHARMACY";

export interface Employee {
  id: string;
  name: string;
  role: string;
  locationId: string;
  locationName: string;
}
