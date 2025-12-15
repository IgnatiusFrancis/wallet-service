export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    if (!currency || currency.trim() === '') {
      throw new Error('Currency is required');
    }
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const newAmount = this.amount - other.amount;
    if (newAmount < 0) {
      throw new Error('Insufficient funds');
    }
    return new Money(newAmount, this.currency);
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount >= other.amount;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
  }
}
