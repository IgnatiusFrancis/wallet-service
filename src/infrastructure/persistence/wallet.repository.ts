import { Injectable } from '@nestjs/common';
import { Wallet } from '@domain/entities/wallet.entity';
import { WalletId } from '@domain/value-objects/wallet-id.vo';
import { Money } from '@domain/value-objects/money.vo';
import { IWalletRepository } from '@domain/repositories/wallet.interface';

@Injectable()
export class InMemoryWalletRepository implements IWalletRepository {
  private wallets = new Map<string, Wallet>();
  private locks = new Map<string, Promise<void>>();

  async save(wallet: Wallet): Promise<Wallet> {
    this.wallets.set(wallet.id.value, this.cloneWallet(wallet));
    return wallet;
  }

  async findById(id: string): Promise<Wallet | null> {
    const wallet = this.wallets.get(id);
    return wallet ? this.cloneWallet(wallet) : null;
  }

  async findByIdWithLock(id: string): Promise<Wallet | null> {
    await this.acquireLock(id);
    try {
      return await this.findById(id);
    } finally {
      this.releaseLock(id);
    }
  }

  async findMultipleByIdsWithLock(ids: string[]): Promise<Map<string, Wallet>> {
    // Acquire locks in order to prevent deadlock
    for (const id of ids) {
      await this.acquireLock(id);
    }

    try {
      const result = new Map<string, Wallet>();
      for (const id of ids) {
        const wallet = await this.findById(id);
        if (wallet) {
          result.set(id, wallet);
        }
      }
      return result;
    } finally {
      for (const id of ids) {
        this.releaseLock(id);
      }
    }
  }

  private async acquireLock(id: string): Promise<void> {
    while (this.locks.has(id)) {
      await this.locks.get(id);
    }

    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(id, lockPromise);
  }

  private releaseLock(id: string): void {
    const lock = this.locks.get(id);
    if (lock) {
      this.locks.delete(id);
    }
  }

  private cloneWallet(wallet: Wallet): Wallet {
    const cloned = new Wallet(
      new WalletId(wallet.id.value),
      new Money(wallet.balance.amount, wallet.balance.currency),
      wallet.createdAt,
    );

    wallet.transactions.forEach((txn) => cloned.addTransaction(txn));

    return cloned;
  }
}
