import { v4 as uuidv4 } from 'uuid';

export class WalletId {
  constructor(public readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('Wallet ID cannot be empty');
    }
  }

  static generate(): WalletId {
    return new WalletId(uuidv4());
  }

  equals(other: WalletId): boolean {
    return this.value === other.value;
  }
}
