import {
  purchaseOrderRepository,
  PurchaseOrder,
  PurchaseOrderWithLines,
} from "@/repositories/purchaseOrderRepository";
import {
  purchaseOrderLineRepository,
  PurchaseOrderLine,
} from "@/repositories/purchaseOrderLineRepository";
import { requisitionRepository } from "@/repositories/requisitionRepository";
import { productRepository } from "@/repositories/productRepository";

export interface CreatePOFromRequisitionInput {
  requisitionId: number;
  supplierId: number;
  deliveryLocationId: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  unitPrice: number;
  createdBy: number;
}

export interface CreatePOResult {
  purchaseOrder: PurchaseOrder;
  purchaseOrderLine: PurchaseOrderLine;
}

import { locationRepository } from "@/repositories/locationRepository";
import { supplierRepository } from "@/repositories/supplierRepository";

export interface EnrichedPurchaseOrder extends PurchaseOrder {
  deliveryLocationName?: string;
  supplierName?: string;
}

export const purchaseOrderService = {
  async generatePoNumber(): Promise<string> {
    const allPOs = await purchaseOrderRepository.findAll();
    const nextNum = allPOs.length + 1;
    return `PO-${String(nextNum).padStart(4, "0")}`;
  },

  async createPurchaseOrderFromRequisition(
    input: CreatePOFromRequisitionInput
  ): Promise<CreatePOResult> {
    // 1. Fetch requisition & validate status
    const requisition = await requisitionRepository.findById(input.requisitionId);
    if (!requisition) {
      throw new Error(`Requisition #${input.requisitionId} not found.`);
    }
    if (requisition.status !== "approved") {
      throw new Error(
        `Requisition must be approved before creating a purchase order. Current status: '${requisition.status}'.`
      );
    }

    // 2. Fetch product details to get taxPercent
    const product = await productRepository.findById(requisition.productId);
    if (!product) {
      throw new Error(`Product #${requisition.productId} not found.`);
    }

    const quantity = requisition.quantity;
    const unitPriceNum = Number(input.unitPrice);
    const taxPercentNum = Number(product.taxPercent);
    const lineTotalNum = quantity * unitPriceNum * (1 + taxPercentNum / 100);

    // 3. Generate PO number and create PO header
    const poNumber = await this.generatePoNumber();
    const purchaseOrder = await purchaseOrderRepository.create({
      poNumber,
      supplierId: input.supplierId,
      deliveryLocationId: input.deliveryLocationId,
      orderDate: input.orderDate,
      expectedDeliveryDate: input.expectedDeliveryDate ?? null,
      createdBy: input.createdBy,
      status: "open",
    });

    // 4. Create PO line
    const purchaseOrderLine = await purchaseOrderLineRepository.create({
      purchaseOrderId: purchaseOrder.id,
      requisitionId: requisition.id,
      productId: requisition.productId,
      quantity,
      unitPrice: unitPriceNum.toFixed(2),
      taxPercent: taxPercentNum.toFixed(2),
      lineTotal: lineTotalNum.toFixed(2),
    });

    // 5. Update requisition status to 'fulfilled'
    await requisitionRepository.updateStatus(requisition.id, "fulfilled");

    return { purchaseOrder, purchaseOrderLine };
  },

  async getPurchaseOrderWithLines(id: number): Promise<PurchaseOrderWithLines | null> {
    return await purchaseOrderRepository.findWithLines(id);
  },

  async listAllPurchaseOrders(): Promise<EnrichedPurchaseOrder[]> {
    const pos = await purchaseOrderRepository.findAll();
    const [locationsList, suppliersList] = await Promise.all([
      locationRepository.findAll(),
      supplierRepository.findAll(),
    ]);

    const locationMap = new Map(locationsList.map((l) => [l.id, l.name]));
    const supplierMap = new Map(suppliersList.map((s) => [s.id, s.name]));

    return pos.map((po) => ({
      ...po,
      deliveryLocationName: locationMap.get(po.deliveryLocationId) || `Location #${po.deliveryLocationId}`,
      supplierName: supplierMap.get(po.supplierId) || `Supplier #${po.supplierId}`,
    }));
  },
};
