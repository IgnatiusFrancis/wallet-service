export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class WalletNotFoundException extends DomainException {
  constructor(walletId: string) {
    super(`Wallet with ID ${walletId} not found`);
  }
}

export class InsufficientFundsException extends DomainException {
  constructor(walletId: string) {
    super(`Insufficient funds in wallet ${walletId}`);
  }
}

export class CurrencyMismatchException extends DomainException {
  constructor(currency1: string, currency2: string) {
    super(`Currency mismatch: ${currency1} vs ${currency2}`);
  }
}

export class InvalidAmountException extends DomainException {
  constructor(amount: number) {
    super(`Invalid amount: ${amount}. Amount must be positive`);
  }
}

export class DuplicateOperationException extends DomainException {
  constructor(idempotencyKey: string) {
    super(`Operation with idempotency key ${idempotencyKey} already processed`);
  }
}
