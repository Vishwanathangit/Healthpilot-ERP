import { db } from "@/db";
import { stockTransfers } from "@/db/schema";
import {
  stockTransferRepository,
  StockTransfer,
} from "@/repositories/stockTransferRepository";
import { stockLedgerRepository } from "@/repositories/stockLedgerRepository";

export interface DispatchTransferInput {
  sourceLocationId: number;
  destinationLocationId: number;
  productId: number;
  batchId: number;
  quantity: number;
  dispatchedBy: number;
  dispatchedAt: Date;
}

export interface ReceiveTransferInput {
  transferId: number;
  receivedBy: number;
  receivedAt: Date;
}

export const stockTransferService = {
  async generateTransferNumber(): Promise<string> {
    const allTransfers = await db.select().from(stockTransfers);
    const nextNum = allTransfers.length + 1;
    return `TRF-${String(nextNum).padStart(4, "0")}`;
  },

  async dispatchTransfer(input: DispatchTransferInput): Promise<StockTransfer> {
    const availableBalance = await stockLedgerRepository.getCurrentBalance(
      input.sourceLocationId,
      input.productId,
      input.batchId
    );

    if (input.quantity > availableBalance) {
      throw new Error(
        `Insufficient stock at source location. Requested: ${input.quantity}, Available: ${availableBalance}.`
      );
    }

    const transferNumber = await this.generateTransferNumber();

    const transfer = await stockTransferRepository.create({
      transferNumber,
      sourceLocationId: input.sourceLocationId,
      destinationLocationId: input.destinationLocationId,
      productId: input.productId,
      batchId: input.batchId,
      quantity: input.quantity,
      dispatchedBy: input.dispatchedBy,
      dispatchedAt: input.dispatchedAt,
      status: "dispatched",
    });

    const balanceAfter = availableBalance - input.quantity;

    await stockLedgerRepository.create({
      locationId: input.sourceLocationId,
      productId: input.productId,
      batchId: input.batchId,
      transactionType: "transfer_out",
      referenceTable: "stock_transfers",
      referenceId: transfer.id,
      quantityIn: 0,
      quantityOut: input.quantity,
      balanceAfter,
    });

    return transfer;
  },

  async receiveTransfer(input: ReceiveTransferInput): Promise<StockTransfer> {
    const transfer = await stockTransferRepository.findById(input.transferId);
    if (!transfer) {
      throw new Error(`Stock Transfer #${input.transferId} not found.`);
    }

    if (transfer.status !== "dispatched") {
      throw new Error(
        `Cannot receive transfer in status '${transfer.status}'. Transfer must be 'dispatched'.`
      );
    }

    const updatedTransfer = await stockTransferRepository.markReceived(
      input.transferId,
      input.receivedBy,
      input.receivedAt
    );

    if (!updatedTransfer) {
      throw new Error("Failed to update stock transfer status.");
    }

    const currentDestBalance = await stockLedgerRepository.getCurrentBalance(
      transfer.destinationLocationId,
      transfer.productId,
      transfer.batchId
    );

    const balanceAfter = currentDestBalance + transfer.quantity;

    await stockLedgerRepository.create({
      locationId: transfer.destinationLocationId,
      productId: transfer.productId,
      batchId: transfer.batchId,
      transactionType: "transfer_in",
      referenceTable: "stock_transfers",
      referenceId: transfer.id,
      quantityIn: transfer.quantity,
      quantityOut: 0,
      balanceAfter,
    });

    return updatedTransfer;
  },

  async listTransfersByLocation(locationId: number): Promise<StockTransfer[]> {
    return await stockTransferRepository.findByLocation(locationId);
  },
};
