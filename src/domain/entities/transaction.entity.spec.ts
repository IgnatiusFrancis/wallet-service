import { Transaction, TransactionType } from './transaction.entity';

describe('Transaction Entity', () => {
  describe('create', () => {
    it('should create transaction with all required fields', () => {
      const txn = Transaction.create({
        walletId: 'wallet-123',
        type: TransactionType.CREDIT,
        amount: 100,
        currency: 'USD',
        balanceAfter: 100,
      });

      expect(txn.id).toBeDefined();
      expect(txn.walletId).toBe('wallet-123');
      expect(txn.type).toBe(TransactionType.CREDIT);
      expect(txn.amount).toBe(100);
      expect(txn.currency).toBe('USD');
      expect(txn.balanceAfter).toBe(100);
      expect(txn.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique transaction IDs', () => {
      const txn1 = Transaction.create({
        walletId: 'wallet-123',
        type: TransactionType.CREDIT,
        amount: 100,
        currency: 'USD',
        balanceAfter: 100,
      });

      const txn2 = Transaction.create({
        walletId: 'wallet-123',
        type: TransactionType.CREDIT,
        amount: 50,
        currency: 'USD',
        balanceAfter: 150,
      });

      expect(txn1.id).not.toBe(txn2.id);
    });

    it('should include optional fields when provided', () => {
      const txn = Transaction.create({
        walletId: 'wallet-123',
        type: TransactionType.TRANSFER_OUT,
        amount: 100,
        currency: 'USD',
        balanceAfter: 50,
        reference: 'Payment to Alice',
        relatedWalletId: 'wallet-456',
        idempotencyKey: 'key-abc',
      });

      expect(txn.reference).toBe('Payment to Alice');
      expect(txn.relatedWalletId).toBe('wallet-456');
      expect(txn.idempotencyKey).toBe('key-abc');
    });
  });
});
