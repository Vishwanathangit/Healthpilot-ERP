import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  numeric,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", [
  "branch_user",
  "purchasing",
  "warehouse",
  "finance",
]);

export const locationTypeEnum = pgEnum("location_type", [
  "warehouse",
  "branch",
]);

export const requisitionStatusEnum = pgEnum("requisition_status", [
  "pending",
  "approved",
  "rejected",
  "fulfilled",
  "partially_fulfilled",
]);

export const poStatusEnum = pgEnum("po_status", [
  "open",
  "partially_received",
  "completed",
  "cancelled",
]);

export const grnStatusEnum = pgEnum("grn_status", ["completed", "corrected"]);

export const invoiceMatchStatusEnum = pgEnum("invoice_match_status", [
  "matched",
  "disputed",
  "resolved",
]);

export const transferStatusEnum = pgEnum("transfer_status", [
  "dispatched",
  "received",
]);

export const ledgerTransactionTypeEnum = pgEnum("ledger_transaction_type", [
  "receipt",
  "correction",
  "transfer_out",
  "transfer_in",
  "sale",
  "damaged",
  "missing",
]);

// 1. Locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: locationTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull(),
  locationId: integer("location_id").references(() => locations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  storageCondition: text("storage_condition"),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull(),
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Batches
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  batchNumber: text("batch_number").notNull(),
  expiryDate: date("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("batches_product_id_batch_number_unique").on(table.productId, table.batchNumber),
]);

// 6. Requisitions
export const requisitions = pgTable("requisitions", {
  id: serial("id").primaryKey(),
  requisitionNumber: text("requisition_number").notNull().unique(),
  locationId: integer("location_id")
    .notNull()
    .references(() => locations.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  requiredDate: date("required_date").notNull(),
  requestedBy: integer("requested_by")
    .notNull()
    .references(() => employees.id),
  reason: text("reason"),
  status: requisitionStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  deliveryLocationId: integer("delivery_location_id")
    .notNull()
    .references(() => locations.id),
  orderDate: date("order_date").notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => employees.id),
  status: poStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Purchase Order Lines
export const purchaseOrderLines = pgTable("purchase_order_lines", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  requisitionId: integer("requisition_id").references(() => requisitions.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Goods Receipts
export const goodsReceipts = pgTable("goods_receipts", {
  id: serial("id").primaryKey(),
  grnNumber: text("grn_number").notNull().unique(),
  purchaseOrderId: integer("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  supplierDeliveryReference: text("supplier_delivery_reference").notNull(),
  receivedDate: date("received_date").notNull(),
  receivedBy: integer("received_by")
    .notNull()
    .references(() => employees.id),
  status: grnStatusEnum("status").default("completed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 10. Goods Receipt Lines
export const goodsReceiptLines = pgTable("goods_receipt_lines", {
  id: serial("id").primaryKey(),
  goodsReceiptId: integer("goods_receipt_id")
    .notNull()
    .references(() => goodsReceipts.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  batchId: integer("batch_id")
    .notNull()
    .references(() => batches.id),
  physicalQuantity: integer("physical_quantity").notNull(),
  acceptedQuantity: integer("accepted_quantity").notNull(),
  damagedQuantity: integer("damaged_quantity").notNull(),
  missingQuantity: integer("missing_quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Goods Receipt Corrections
export const goodsReceiptCorrections = pgTable("goods_receipt_corrections", {
  id: serial("id").primaryKey(),
  goodsReceiptLineId: integer("goods_receipt_line_id")
    .notNull()
    .references(() => goodsReceiptLines.id),
  originalAcceptedQty: integer("original_accepted_qty").notNull(),
  originalDamagedQty: integer("original_damaged_qty").notNull(),
  originalMissingQty: integer("original_missing_qty").notNull(),
  correctedAcceptedQty: integer("corrected_accepted_qty").notNull(),
  correctedDamagedQty: integer("corrected_damaged_qty").notNull(),
  correctedMissingQty: integer("corrected_missing_qty").notNull(),
  correctedBy: integer("corrected_by")
    .notNull()
    .references(() => employees.id),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Supplier Invoices
export const supplierInvoices = pgTable("supplier_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  purchaseOrderId: integer("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  invoiceAmount: numeric("invoice_amount", { precision: 12, scale: 2 }).notNull(),
  invoiceQuantity: integer("invoice_quantity").notNull(),
  invoiceDate: date("invoice_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 13. Invoice Matches
export const invoiceMatches = pgTable("invoice_matches", {
  id: serial("id").primaryKey(),
  supplierInvoiceId: integer("supplier_invoice_id")
    .notNull()
    .references(() => supplierInvoices.id),
  goodsReceiptId: integer("goods_receipt_id")
    .notNull()
    .references(() => goodsReceipts.id),
  acceptedValue: numeric("accepted_value", { precision: 12, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull(),
  payableAmount: numeric("payable_amount", { precision: 12, scale: 2 }).notNull(),
  disputedAmount: numeric("disputed_amount", { precision: 12, scale: 2 }).notNull(),
  status: invoiceMatchStatusEnum("status").default("matched").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14. Credit Notes
export const creditNotes = pgTable("credit_notes", {
  id: serial("id").primaryKey(),
  creditNoteNumber: text("credit_note_number").notNull().unique(),
  supplierInvoiceId: integer("supplier_invoice_id")
    .notNull()
    .references(() => supplierInvoices.id),
  quantity: integer("quantity").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 15. Stock Transfers
export const stockTransfers = pgTable("stock_transfers", {
  id: serial("id").primaryKey(),
  transferNumber: text("transfer_number").notNull().unique(),
  sourceLocationId: integer("source_location_id")
    .notNull()
    .references(() => locations.id),
  destinationLocationId: integer("destination_location_id")
    .notNull()
    .references(() => locations.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  batchId: integer("batch_id")
    .notNull()
    .references(() => batches.id),
  quantity: integer("quantity").notNull(),
  dispatchedBy: integer("dispatched_by")
    .notNull()
    .references(() => employees.id),
  dispatchedAt: timestamp("dispatched_at").notNull(),
  receivedBy: integer("received_by").references(() => employees.id),
  receivedAt: timestamp("received_at"),
  status: transferStatusEnum("status").default("dispatched").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 16. Sales
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  saleNumber: text("sale_number").notNull().unique(),
  locationId: integer("location_id")
    .notNull()
    .references(() => locations.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  batchId: integer("batch_id")
    .notNull()
    .references(() => batches.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  costAmount: numeric("cost_amount", { precision: 12, scale: 2 }).notNull(),
  patientReference: text("patient_reference").notNull(),
  paymentMethod: text("payment_method").notNull(),
  dispensedBy: integer("dispensed_by")
    .notNull()
    .references(() => employees.id),
  saleDatetime: timestamp("sale_datetime").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 17. Stock Ledger
export const stockLedger = pgTable("stock_ledger", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id")
    .notNull()
    .references(() => locations.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  batchId: integer("batch_id")
    .notNull()
    .references(() => batches.id),
  transactionType: ledgerTransactionTypeEnum("transaction_type").notNull(),
  referenceTable: text("reference_table").notNull(),
  referenceId: integer("reference_id").notNull(),
  quantityIn: integer("quantity_in").default(0).notNull(),
  quantityOut: integer("quantity_out").default(0).notNull(),
  balanceAfter: integer("balance_after").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
