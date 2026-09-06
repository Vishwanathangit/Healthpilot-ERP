import {
  requisitionRepository,
  Requisition,
} from "@/repositories/requisitionRepository";

export interface CreateRequisitionInput {
  locationId: number;
  productId: number;
  quantity: number;
  requiredDate: string;
  requestedBy: number;
  reason?: string;
}

export const requisitionService = {
  async generateRequisitionNumber(): Promise<string> {
    const allReqs = await requisitionRepository.findAll();
    const nextNum = allReqs.length + 1;
    return `REQ-${String(nextNum).padStart(4, "0")}`;
  },

  async createRequisition(input: CreateRequisitionInput): Promise<Requisition> {
    const requisitionNumber = await this.generateRequisitionNumber();
    return await requisitionRepository.create({
      requisitionNumber,
      locationId: input.locationId,
      productId: input.productId,
      quantity: input.quantity,
      requiredDate: input.requiredDate,
      requestedBy: input.requestedBy,
      reason: input.reason ?? null,
      status: "pending",
    });
  },

  async approveRequisition(requisitionId: number, approvedBy: number): Promise<Requisition> {
    if (!approvedBy) {
      throw new Error("Acting employee (approvedBy) must be provided.");
    }
    const requisition = await requisitionRepository.findById(requisitionId);
    if (!requisition) {
      throw new Error(`Requisition #${requisitionId} not found.`);
    }
    if (requisition.status !== "pending") {
      throw new Error(`Cannot approve requisition in status '${requisition.status}'. Requisition must be 'pending'.`);
    }

    const updated = await requisitionRepository.updateStatus(requisitionId, "approved");
    if (!updated) {
      throw new Error("Failed to update requisition status.");
    }
    return updated;
  },

  async rejectRequisition(requisitionId: number): Promise<Requisition> {
    const requisition = await requisitionRepository.findById(requisitionId);
    if (!requisition) {
      throw new Error(`Requisition #${requisitionId} not found.`);
    }
    if (requisition.status !== "pending") {
      throw new Error(`Cannot reject requisition in status '${requisition.status}'. Requisition must be 'pending'.`);
    }

    const updated = await requisitionRepository.updateStatus(requisitionId, "rejected");
    if (!updated) {
      throw new Error("Failed to update requisition status.");
    }
    return updated;
  },

  async listRequisitionsByLocation(locationId: number): Promise<Requisition[]> {
    return await requisitionRepository.findByLocation(locationId);
  },

  async listAllRequisitions(): Promise<Requisition[]> {
    return await requisitionRepository.findAll();
  },
};
