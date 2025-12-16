import { Wallet } from '../../src/domain/entities/wallet.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { TransactionType } from '../../src/domain/entities/transaction.entity';
import { InMemoryWalletRepository } from '@infrastructure/persistence/wallet.repository';
import { InMemoryTransactionRepository } from '@infrastructure/persistence/transaction.repository';

describe('Wallet Repository Integration Tests', () => {
  let walletRepo: InMemoryWalletRepository;
  let transactionRepo: InMemoryTransactionRepository;

  beforeEach(() => {
    walletRepo = new InMemoryWalletRepository();
    transactionRepo = new InMemoryTransactionRepository();
  });

  describe('Basic CRUD Operations', () => {
    it('should save and retrieve a wallet', async () => {
      const wallet = Wallet.create('USD');

      await walletRepo.save(wallet);
      const retrieved = await walletRepo.findById(wallet.id.value);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id.value).toBe(wallet.id.value);
      expect(retrieved!.balance.amount).toBe(0);
      expect(retrieved!.balance.currency).toBe('USD');
    });

    it('should return null for non-existent wallet', async () => {
      const result = await walletRepo.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should update wallet balance on save', async () => {
      const wallet = Wallet.create('USD');
      await walletRepo.save(wallet);

      wallet.credit(new Money(500, 'USD'));
      await walletRepo.save(wallet);

      const updated = await walletRepo.findById(wallet.id.value);

      expect(updated!.balance.amount).toBe(500);
    });

    it('should persist multiple wallets independently', async () => {
      const wallet1 = Wallet.create('USD');
      const wallet2 = Wallet.create('USD');

      wallet1.credit(new Money(100, 'USD'));
      wallet2.credit(new Money(200, 'USD'));

      await walletRepo.save(wallet1);
      await walletRepo.save(wallet2);

      const retrieved1 = await walletRepo.findById(wallet1.id.value);
      const retrieved2 = await walletRepo.findById(wallet2.id.value);

      expect(retrieved1!.balance.amount).toBe(100);
      expect(retrieved2!.balance.amount).toBe(200);
    });
  });

  describe('Wallet Locking Mechanism', () => {
    it('should acquire and release lock correctly', async () => {
      const wallet = Wallet.create('USD');
      await walletRepo.save(wallet);

      const locked = await walletRepo.findByIdWithLock(wallet.id.value);

      expect(locked).not.toBeNull();
      expect(locked!.id.value).toBe(wallet.id.value);
    });

    it('should handle sequential locks on same wallet', async () => {
      const wallet = Wallet.create('USD');
      await walletRepo.save(wallet);

      const lock1 = await walletRepo.findByIdWithLock(wallet.id.value);
      const lock2 = await walletRepo.findByIdWithLock(wallet.id.value);

      expect(lock1).not.toBeNull();
      expect(lock2).not.toBeNull();
      expect(lock1!.id.value).toBe(lock2!.id.value);
    });

    it('should lock multiple wallets in order', async () => {
      const wallet1 = Wallet.create('USD');
      const wallet2 = Wallet.create('USD');

      await walletRepo.save(wallet1);
      await walletRepo.save(wallet2);

      const ids = [wallet1.id.value, wallet2.id.value].sort();
      const lockedWallets = await walletRepo.findMultipleByIdsWithLock(ids);

      expect(lockedWallets.size).toBe(2);
      expect(lockedWallets.has(wallet1.id.value)).toBe(true);
      expect(lockedWallets.has(wallet2.id.value)).toBe(true);
    });

    it('should return empty map when wallets do not exist', async () => {
      const result = await walletRepo.findMultipleByIdsWithLock(['id1', 'id2']);

      expect(result.size).toBe(0);
    });

    it('should return partial results when some wallets exist', async () => {
      const wallet = Wallet.create('USD');
      await walletRepo.save(wallet);

      const result = await walletRepo.findMultipleByIdsWithLock([
        wallet.id.value,
        'non-existent-id',
      ]);

      expect(result.size).toBe(1);
      expect(result.has(wallet.id.value)).toBe(true);
    });
  });

  describe('Data Isolation and Cloning', () => {
    it('should return independent copies of wallets', async () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(100, 'USD'));
      await walletRepo.save(wallet);

      const copy1 = await walletRepo.findById(wallet.id.value);
      const copy2 = await walletRepo.findById(wallet.id.value);

      copy1!.credit(new Money(50, 'USD'));

      expect(copy1!.balance.amount).toBe(150);
      expect(copy2!.balance.amount).toBe(100);
    });

    it('should preserve transaction history on retrieval', async () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(100, 'USD'));
      wallet.credit(new Money(200, 'USD'));
      await walletRepo.save(wallet);

      const retrieved = await walletRepo.findById(wallet.id.value);

      expect(retrieved!.transactions).toHaveLength(2);
      expect(retrieved!.transactions[0].amount).toBe(100);
      expect(retrieved!.transactions[1].amount).toBe(200);
    });

    it('should not share transaction references', async () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(100, 'USD'));
      await walletRepo.save(wallet);

      const copy1 = await walletRepo.findById(wallet.id.value);
      const copy2 = await walletRepo.findById(wallet.id.value);

      expect(copy1!.transactions).not.toBe(copy2!.transactions);
      expect(copy1!.transactions).toEqual(copy2!.transactions);
    });
  });

  describe('Transaction Repository Integration', () => {
    it('should save and retrieve transactions', async () => {
      const wallet = Wallet.create('USD');
      const txn = wallet.credit(new Money(500, 'USD'));

      await transactionRepo.save(txn);
      const transactions = await transactionRepo.findByWalletId(
        wallet.id.value,
      );

      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe(txn.id);
      expect(transactions[0].amount).toBe(500);
      expect(transactions[0].type).toBe(TransactionType.CREDIT);
    });

    it('should retrieve multiple transactions for a wallet', async () => {
      const wallet = Wallet.create('USD');
      const txn1 = wallet.credit(new Money(100, 'USD'));
      const txn2 = wallet.credit(new Money(200, 'USD'));
      const txn3 = wallet.debit(new Money(50, 'USD'));

      await transactionRepo.save(txn1);
      await transactionRepo.save(txn2);
      await transactionRepo.save(txn3);

      const transactions = await transactionRepo.findByWalletId(
        wallet.id.value,
      );

      expect(transactions).toHaveLength(3);
      expect(transactions[0].amount).toBe(50);
      expect(transactions[1].amount).toBe(200);
      expect(transactions[2].amount).toBe(100);
    });

    it('should return empty array for wallet with no transactions', async () => {
      const transactions = await transactionRepo.findByWalletId(
        'non-existent-wallet',
      );

      expect(transactions).toEqual([]);
    });

    it('should handle idempotency key lookups', async () => {
      const wallet = Wallet.create('USD');
      const txn = wallet.credit(new Money(500, 'USD'), 'key-123');

      await transactionRepo.save(txn);
      const found = await transactionRepo.findByIdempotencyKey('key-123');

      expect(found).not.toBeNull();
      expect(found!.id).toBe(txn.id);
      expect(found!.idempotencyKey).toBe('key-123');
    });

    it('should return null for non-existent idempotency key', async () => {
      const result = await transactionRepo.findByIdempotencyKey('non-existent');

      expect(result).toBeNull();
    });

    it('should index transactions by idempotency key', async () => {
      const wallet1 = Wallet.create('USD');
      const wallet2 = Wallet.create('USD');

      const txn1 = wallet1.credit(new Money(100, 'USD'), 'key-1');
      const txn2 = wallet2.credit(new Money(200, 'USD'), 'key-2');

      await transactionRepo.save(txn1);
      await transactionRepo.save(txn2);

      const found1 = await transactionRepo.findByIdempotencyKey('key-1');
      const found2 = await transactionRepo.findByIdempotencyKey('key-2');

      expect(found1!.amount).toBe(100);
      expect(found2!.amount).toBe(200);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent saves correctly', async () => {
      const wallet1 = Wallet.create('USD');
      const wallet2 = Wallet.create('USD');
      const wallet3 = Wallet.create('USD');

      await Promise.all([
        walletRepo.save(wallet1),
        walletRepo.save(wallet2),
        walletRepo.save(wallet3),
      ]);

      const retrieved1 = await walletRepo.findById(wallet1.id.value);
      const retrieved2 = await walletRepo.findById(wallet2.id.value);
      const retrieved3 = await walletRepo.findById(wallet3.id.value);

      expect(retrieved1).not.toBeNull();
      expect(retrieved2).not.toBeNull();
      expect(retrieved3).not.toBeNull();
    });

    it('should handle concurrent transaction saves', async () => {
      const wallet = Wallet.create('USD');
      const txn1 = wallet.credit(new Money(100, 'USD'));
      const txn2 = wallet.credit(new Money(200, 'USD'));
      const txn3 = wallet.credit(new Money(300, 'USD'));

      await Promise.all([
        transactionRepo.save(txn1),
        transactionRepo.save(txn2),
        transactionRepo.save(txn3),
      ]);

      const transactions = await transactionRepo.findByWalletId(
        wallet.id.value,
      );

      expect(transactions).toHaveLength(3);
    });

    it('should maintain data consistency under concurrent access', async () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(1000, 'USD'));
      await walletRepo.save(wallet);

      const operations = Array.from({ length: 5 }, async (_, i) => {
        const w = await walletRepo.findByIdWithLock(wallet.id.value);
        w!.credit(new Money(100, 'USD'));
        await walletRepo.save(w!);
      });

      await Promise.all(operations);

      const final = await walletRepo.findById(wallet.id.value);
      expect(final!.balance.amount).toBe(1500); // 1000 + (5 * 100)
    });
  });

  describe('Edge Cases', () => {
    it('should handle wallet with zero balance', async () => {
      const wallet = Wallet.create('USD');

      await walletRepo.save(wallet);
      const retrieved = await walletRepo.findById(wallet.id.value);

      expect(retrieved!.balance.amount).toBe(0);
    });

    it('should handle wallet with large balance', async () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(999999999.99, 'USD'));

      await walletRepo.save(wallet);
      const retrieved = await walletRepo.findById(wallet.id.value);

      expect(retrieved!.balance.amount).toBe(999999999.99);
    });

    it('should handle wallet with many transactions', async () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(10000, 'USD'));

      // Create 100 transactions
      for (let i = 0; i < 100; i++) {
        const txn = wallet.debit(new Money(10, 'USD'));
        await transactionRepo.save(txn);
      }

      const transactions = await transactionRepo.findByWalletId(
        wallet.id.value,
      );

      expect(transactions).toHaveLength(100);
    });

    it('should preserve creation timestamps', async () => {
      const beforeCreate = new Date();
      const wallet = Wallet.create('USD');
      const afterCreate = new Date();

      await walletRepo.save(wallet);
      const retrieved = await walletRepo.findById(wallet.id.value);

      expect(retrieved!.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(retrieved!.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });

    it('should handle special characters in wallet IDs', async () => {
      const wallet = Wallet.create('USD');
      const walletId = wallet.id.value;

      await walletRepo.save(wallet);
      const retrieved = await walletRepo.findById(walletId);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id.value).toBe(walletId);
    });
  });

  describe('Repository State Management', () => {
    it('should maintain separate state between instances', async () => {
      const repo1 = new InMemoryWalletRepository();
      const repo2 = new InMemoryWalletRepository();

      const wallet1 = Wallet.create('USD');
      const wallet2 = Wallet.create('USD');

      await repo1.save(wallet1);
      await repo2.save(wallet2);

      const fromRepo1 = await repo1.findById(wallet1.id.value);
      const fromRepo2 = await repo2.findById(wallet1.id.value);

      expect(fromRepo1).not.toBeNull();
      expect(fromRepo2).toBeNull();
    });

    it('should clear state when creating new instance', () => {
      const repo1 = new InMemoryWalletRepository();
      const wallet = Wallet.create('USD');

      repo1.save(wallet);
      const repo2 = new InMemoryWalletRepository();

      expect(repo2.findById(wallet.id.value)).resolves.toBeNull();
    });
  });

  describe('Transaction Ordering', () => {
    it('should return transactions in reverse chronological order', async () => {
      const wallet = Wallet.create('USD');

      // Create transactions with slight delays to ensure different timestamps
      const txn1 = wallet.credit(new Money(100, 'USD'));
      await new Promise((resolve) => setTimeout(resolve, 5));

      const txn2 = wallet.credit(new Money(200, 'USD'));
      await new Promise((resolve) => setTimeout(resolve, 5));

      const txn3 = wallet.credit(new Money(300, 'USD'));

      await transactionRepo.save(txn1);
      await transactionRepo.save(txn2);
      await transactionRepo.save(txn3);

      const transactions = await transactionRepo.findByWalletId(
        wallet.id.value,
      );

      expect(transactions[0].amount).toBe(300);
      expect(transactions[1].amount).toBe(200);
      expect(transactions[2].amount).toBe(100);
    });
  });
});
