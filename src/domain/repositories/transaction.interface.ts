import { Transaction } from '../entities/transaction.entity';

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
  findByWalletId(walletId: string): Promise<Transaction[]>;
  findByIdempotencyKey(key: string): Promise<Transaction | null>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
