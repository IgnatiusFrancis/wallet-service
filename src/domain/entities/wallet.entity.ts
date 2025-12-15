import { Money } from '@domain/value-objects/money.vo';
import { Transaction, TransactionType } from './transaction.entity';
import { WalletId } from '@domain/value-objects/wallet-id.vo';

export class Wallet {
  private _balance: Money;
  private _transactions: Transaction[] = [];

  constructor(
    public readonly id: WalletId,
    balance: Money,
    public readonly createdAt: Date = new Date(),
  ) {
    this._balance = balance;
  }

  static create(currency: string): Wallet {
    return new Wallet(WalletId.generate(), new Money(0, currency), new Date());
  }

  get balance(): Money {
    return this._balance;
  }

  get transactions(): Transaction[] {
    return [...this._transactions];
  }

  credit(
    amount: Money,
    idempotencyKey?: string,
    reference?: string,
  ): Transaction {
    const newBalance = this._balance.add(amount);
    this._balance = newBalance;

    const txn = Transaction.create({
      walletId: this.id.value,
      type: TransactionType.CREDIT,
      amount: amount.amount,
      currency: amount.currency,
      balanceAfter: this._balance.amount,
      reference,
      idempotencyKey,
    });

    this._transactions.push(txn);
    return txn;
  }

  debit(
    amount: Money,
    idempotencyKey?: string,
    reference?: string,
    relatedWalletId?: string,
  ): Transaction {
    if (!this._balance.isGreaterThanOrEqual(amount)) {
      throw new Error('Insufficient funds');
    }

    const newBalance = this._balance.subtract(amount);
    this._balance = newBalance;

    const txn = Transaction.create({
      walletId: this.id.value,
      type: relatedWalletId
        ? TransactionType.TRANSFER_OUT
        : TransactionType.DEBIT,
      amount: amount.amount,
      currency: amount.currency,
      balanceAfter: this._balance.amount,
      reference,
      relatedWalletId,
      idempotencyKey,
    });

    this._transactions.push(txn);
    return txn;
  }

  addTransaction(transaction: Transaction): void {
    this._transactions.push(transaction);
  }
}
