CREATE TYPE "public"."grn_status" AS ENUM('completed', 'corrected');--> statement-breakpoint
CREATE TABLE "goods_receipt_corrections" (
	"id" serial PRIMARY KEY NOT NULL,
	"goods_receipt_line_id" integer NOT NULL,
	"original_accepted_qty" integer NOT NULL,
	"original_damaged_qty" integer NOT NULL,
	"original_missing_qty" integer NOT NULL,
	"corrected_accepted_qty" integer NOT NULL,
	"corrected_damaged_qty" integer NOT NULL,
	"corrected_missing_qty" integer NOT NULL,
	"corrected_by" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"goods_receipt_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"batch_id" integer NOT NULL,
	"physical_quantity" integer NOT NULL,
	"accepted_quantity" integer NOT NULL,
	"damaged_quantity" integer NOT NULL,
	"missing_quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"grn_number" text NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"supplier_delivery_reference" text NOT NULL,
	"received_date" date NOT NULL,
	"received_by" integer NOT NULL,
	"status" "grn_status" DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "goods_receipts_grn_number_unique" UNIQUE("grn_number")
);
--> statement-breakpoint
ALTER TABLE "goods_receipt_corrections" ADD CONSTRAINT "goods_receipt_corrections_goods_receipt_line_id_goods_receipt_lines_id_fk" FOREIGN KEY ("goods_receipt_line_id") REFERENCES "public"."goods_receipt_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_corrections" ADD CONSTRAINT "goods_receipt_corrections_corrected_by_employees_id_fk" FOREIGN KEY ("corrected_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_received_by_employees_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;