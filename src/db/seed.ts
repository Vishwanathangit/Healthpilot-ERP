import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";
import { locations, products, suppliers, employees } from "./schema";

async function main() {
  console.log("🌱 Starting database seeding...");

  // Check idempotency - skip if locations already seeded
  const existingLocs = await db.select().from(locations);
  if (existingLocs.length > 0) {
    console.log("⚠️ Master data already exists in database. Skipping seed execution.");
    process.exit(0);
  }

  // 1. Insert Locations
  console.log("📍 Inserting locations...");
  const insertedLocations = await db
    .insert(locations)
    .values([
      { name: "Central Pharmacy Warehouse", type: "warehouse" },
      { name: "Branch A", type: "branch" },
      { name: "Branch B", type: "branch" },
      { name: "Branch C", type: "branch" },
    ])
    .returning();

  console.log(`✅ Locations inserted (${insertedLocations.length}):`, insertedLocations.map((l) => `${l.name} (ID: ${l.id})`));

  const warehouseLoc = insertedLocations.find((l) => l.name === "Central Pharmacy Warehouse")!;
  const branchALoc = insertedLocations.find((l) => l.name === "Branch A")!;
  const branchBLoc = insertedLocations.find((l) => l.name === "Branch B")!;
  const branchCLoc = insertedLocations.find((l) => l.name === "Branch C")!;

  // 2. Insert Products
  console.log("💊 Inserting product...");
  const insertedProducts = await db
    .insert(products)
    .values([
      {
        name: "Insulin Glargine 100 IU/ml",
        unit: "Vial",
        storageCondition: "Refrigerated between 2°C and 8°C",
        purchasePrice: "500.00",
        taxPercent: "5.00",
      },
    ])
    .returning();

  console.log(`✅ Product inserted (${insertedProducts.length}):`, insertedProducts.map((p) => `${p.name} (ID: ${p.id})`));

  // 3. Insert Suppliers
  console.log("🏢 Inserting supplier...");
  const insertedSuppliers = await db
    .insert(suppliers)
    .values([
      {
        name: "MediSupply Pharmaceuticals Pvt. Ltd.",
        contactInfo: "N/A",
      },
    ])
    .returning();

  console.log(`✅ Supplier inserted (${insertedSuppliers.length}):`, insertedSuppliers.map((s) => `${s.name} (ID: ${s.id})`));

  // 4. Insert Employees
  console.log("👥 Inserting employees...");
  const insertedEmployees = await db
    .insert(employees)
    .values([
      {
        name: "Branch A User",
        role: "branch_user",
        locationId: branchALoc.id,
      },
      {
        name: "Branch B User",
        role: "branch_user",
        locationId: branchBLoc.id,
      },
      {
        name: "Branch C User",
        role: "branch_user",
        locationId: branchCLoc.id,
      },
      {
        name: "Purchasing Officer",
        role: "purchasing",
        locationId: null,
      },
      {
        name: "Warehouse Officer",
        role: "warehouse",
        locationId: warehouseLoc.id,
      },
      {
        name: "Finance Officer",
        role: "finance",
        locationId: null,
      },
    ])
    .returning();

  console.log(`✅ Employees inserted (${insertedEmployees.length}):`, insertedEmployees.map((e) => `${e.name} (${e.role}) -> Location ID: ${e.locationId ?? "null"}`));

  console.log("🎉 Seeding completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
