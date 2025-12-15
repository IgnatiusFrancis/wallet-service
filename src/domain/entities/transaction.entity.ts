import { v4 as uuidv4 } from 'uuid';
export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly type: TransactionType,
    public readonly amount: number,
    public readonly currency: string,
    public readonly balanceAfter: number,
    public readonly reference?: string,
    public readonly relatedWalletId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly idempotencyKey?: string,
  ) {}

  static create(params: {
    walletId: string;
    type: TransactionType;
    amount: number;
    currency: string;
    balanceAfter: number;
    reference?: string;
    relatedWalletId?: string;
    idempotencyKey?: string;
  }): Transaction {
    return new Transaction(
      uuidv4(),
      params.walletId,
      params.type,
      params.amount,
      params.currency,
      params.balanceAfter,
      params.reference,
      params.relatedWalletId,
      new Date(),
      params.idempotencyKey,
    );
  }
}
