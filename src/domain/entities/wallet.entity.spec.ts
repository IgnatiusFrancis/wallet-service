import { Wallet } from './wallet.entity';
import { Money } from '../value-objects/money.vo';
import { TransactionType } from './transaction.entity';

describe('Wallet Entity', () => {
  describe('create', () => {
    it('should create wallet with zero balance', () => {
      const wallet = Wallet.create('USD');

      expect(wallet.balance.amount).toBe(0);
      expect(wallet.balance.currency).toBe('USD');
      expect(wallet.id).toBeDefined();
      expect(wallet.createdAt).toBeInstanceOf(Date);
    });

    it('should create wallet with empty transaction history', () => {
      const wallet = Wallet.create('USD');
      expect(wallet.transactions).toHaveLength(0);
    });
  });

  describe('credit', () => {
    it('should increase balance when credited', () => {
      const wallet = Wallet.create('USD');
      const amount = new Money(100, 'USD');

      wallet.credit(amount);

      expect(wallet.balance.amount).toBe(100);
    });

    it('should create transaction record', () => {
      const wallet = Wallet.create('USD');
      const amount = new Money(100, 'USD');

      const txn = wallet.credit(amount);

      expect(txn.type).toBe(TransactionType.CREDIT);
      expect(txn.amount).toBe(100);
      expect(txn.balanceAfter).toBe(100);
      expect(txn.walletId).toBe(wallet.id.value);
    });

    it('should add transaction to history', () => {
      const wallet = Wallet.create('USD');

      wallet.credit(new Money(100, 'USD'));

      expect(wallet.transactions).toHaveLength(1);
      expect(wallet.transactions[0].type).toBe(TransactionType.CREDIT);
    });

    it('should accumulate multiple credits', () => {
      const wallet = Wallet.create('USD');

      wallet.credit(new Money(100, 'USD'));
      wallet.credit(new Money(50, 'USD'));

      expect(wallet.balance.amount).toBe(150);
      expect(wallet.transactions).toHaveLength(2);
    });

    it('should store idempotency key if provided', () => {
      const wallet = Wallet.create('USD');

      const txn = wallet.credit(new Money(100, 'USD'), 'key-123');

      expect(txn.idempotencyKey).toBe('key-123');
    });

    it('should store reference if provided', () => {
      const wallet = Wallet.create('USD');

      const txn = wallet.credit(
        new Money(100, 'USD'),
        undefined,
        'Initial deposit',
      );

      expect(txn.reference).toBe('Initial deposit');
    });
  });

  describe('debit', () => {
    it('should decrease balance when debited', () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(100, 'USD'));

      wallet.debit(new Money(30, 'USD'));

      expect(wallet.balance.amount).toBe(70);
    });

    it('should create debit transaction', () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(100, 'USD'));

      const txn = wallet.debit(new Money(30, 'USD'));

      expect(txn.type).toBe(TransactionType.DEBIT);
      expect(txn.amount).toBe(30);
      expect(txn.balanceAfter).toBe(70);
    });

    it('should throw error when insufficient balance', () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(50, 'USD'));

      expect(() => {
        wallet.debit(new Money(100, 'USD'));
      }).toThrow('Insufficient funds');
    });

    it('should not modify balance on failed debit', () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(50, 'USD'));

      try {
        wallet.debit(new Money(100, 'USD'));
      } catch (e) {}

      expect(wallet.balance.amount).toBe(50);
    });

    it('should allow debiting to zero', () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(100, 'USD'));

      wallet.debit(new Money(100, 'USD'));

      expect(wallet.balance.amount).toBe(0);
    });

    it('should create TRANSFER_OUT transaction when relatedWalletId provided', () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(100, 'USD'));

      const txn = wallet.debit(
        new Money(30, 'USD'),
        undefined,
        undefined,
        'wallet-2',
      );

      expect(txn.type).toBe(TransactionType.TRANSFER_OUT);
      expect(txn.relatedWalletId).toBe('wallet-2');
    });
  });

  describe('transactions', () => {
    it('should return copy of transactions array', () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(100, 'USD'));

      const txns1 = wallet.transactions;
      const txns2 = wallet.transactions;

      expect(txns1).not.toBe(txns2);
      expect(txns1).toEqual(txns2);
    });

    it('should not allow external modification of transactions', () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(100, 'USD'));

      const txns = wallet.transactions;
      txns.push(null as any);

      expect(wallet.transactions).toHaveLength(1);
    });
  });
});
