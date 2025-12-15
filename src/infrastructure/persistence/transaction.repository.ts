import { Injectable } from '@nestjs/common';
import { Transaction } from '@domain/entities/transaction.entity';
import { ITransactionRepository } from '@domain/repositories/transaction.interface';

@Injectable()
export class InMemoryTransactionRepository implements ITransactionRepository {
  private transactions = new Map<string, Transaction>();
  private idempotencyIndex = new Map<string, Transaction>();

  async save(transaction: Transaction): Promise<Transaction> {
    this.transactions.set(transaction.id, transaction);

    if (transaction.idempotencyKey) {
      this.idempotencyIndex.set(transaction.idempotencyKey, transaction);
    }

    return transaction;
  }

  async findByWalletId(walletId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.walletId === walletId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByIdempotencyKey(key: string): Promise<Transaction | null> {
    return this.idempotencyIndex.get(key) || null;
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    for (const txn of this.transactions.values()) {
      if (txn.reference === reference) {
        return txn;
      }
    }
    return null;
  }
}
