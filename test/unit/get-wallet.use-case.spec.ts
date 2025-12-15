import { Test, TestingModule } from '@nestjs/testing';
import { GetWalletUseCase } from '../../src/application/use-cases/get-wallet/get-wallet.use-case';
import { Wallet } from '../../src/domain/entities/wallet.entity';
import {
  Transaction,
  TransactionType,
} from '../../src/domain/entities/transaction.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { WalletNotFoundException } from '../../src/domain/exceptions/domain.exceptions';
import { WALLET_REPOSITORY } from '@domain/repositories/wallet.interface';
import { TRANSACTION_REPOSITORY } from '@domain/repositories/transaction.interface';

describe('GetWalletUseCase', () => {
  let useCase: GetWalletUseCase;
  let mockWalletRepo: any;
  let mockTxnRepo: any;

  beforeEach(async () => {
    mockWalletRepo = {
      findById: jest.fn(),
    };

    mockTxnRepo = {
      findByWalletId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetWalletUseCase,
        { provide: WALLET_REPOSITORY, useValue: mockWalletRepo },
        { provide: TRANSACTION_REPOSITORY, useValue: mockTxnRepo },
      ],
    }).compile();

    useCase = module.get<GetWalletUseCase>(GetWalletUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return wallet details with empty transaction history', async () => {
      // Arrange
      const wallet = Wallet.create('USD');
      mockWalletRepo.findById.mockResolvedValue(wallet);
      mockTxnRepo.findByWalletId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(wallet.id.value);

      // Assert
      expect(result.id).toBe(wallet.id.value);
      expect(result.currency).toBe('USD');
      expect(result.balance).toBe(0);
      expect(result.transactions).toEqual([]);
      expect(mockWalletRepo.findById).toHaveBeenCalledWith(wallet.id.value);
      expect(mockTxnRepo.findByWalletId).toHaveBeenCalledWith(wallet.id.value);
    });

    it('should return wallet with transaction history', async () => {
      // Arrange
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(500, 'USD'), undefined, 'Initial deposit');
      wallet.credit(new Money(300, 'USD'), undefined, 'Second deposit');

      const transactions = [
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.CREDIT,
          amount: 500,
          currency: 'USD',
          balanceAfter: 500,
          reference: 'Initial deposit',
        }),
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.CREDIT,
          amount: 300,
          currency: 'USD',
          balanceAfter: 800,
          reference: 'Second deposit',
        }),
      ];

      mockWalletRepo.findById.mockResolvedValue(wallet);
      mockTxnRepo.findByWalletId.mockResolvedValue(transactions);

      // Act
      const result = await useCase.execute(wallet.id.value);

      // Assert
      expect(result.id).toBe(wallet.id.value);
      expect(result.balance).toBe(800);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].amount).toBe(500);
      expect(result.transactions[0].reference).toBe('Initial deposit');
      expect(result.transactions[1].amount).toBe(300);
      expect(result.transactions[1].reference).toBe('Second deposit');
    });

    it('should throw WalletNotFoundException when wallet does not exist', async () => {
      // Arrange
      mockWalletRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(
        WalletNotFoundException,
      );

      expect(mockWalletRepo.findById).toHaveBeenCalledWith('non-existent-id');
      expect(mockTxnRepo.findByWalletId).not.toHaveBeenCalled();
    });

    it('should return correct transaction types', async () => {
      // Arrange
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(1000, 'USD'));

      const transactions = [
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.CREDIT,
          amount: 1000,
          currency: 'USD',
          balanceAfter: 1000,
        }),
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.TRANSFER_OUT,
          amount: 300,
          currency: 'USD',
          balanceAfter: 700,
          relatedWalletId: 'wallet-2',
        }),
      ];

      mockWalletRepo.findById.mockResolvedValue(wallet);
      mockTxnRepo.findByWalletId.mockResolvedValue(transactions);

      // Act
      const result = await useCase.execute(wallet.id.value);

      // Assert
      expect(result.transactions[0].type).toBe('CREDIT');
      expect(result.transactions[1].type).toBe('TRANSFER_OUT');
      expect(result.transactions[1].relatedWalletId).toBe('wallet-2');
    });

    it('should include transaction timestamps', async () => {
      // Arrange
      const wallet = Wallet.create('USD');
      const now = new Date();

      const transaction = Transaction.create({
        walletId: wallet.id.value,
        type: TransactionType.CREDIT,
        amount: 100,
        currency: 'USD',
        balanceAfter: 100,
      });

      mockWalletRepo.findById.mockResolvedValue(wallet);
      mockTxnRepo.findByWalletId.mockResolvedValue([transaction]);

      // Act
      const result = await useCase.execute(wallet.id.value);

      // Assert
      expect(result.transactions[0].createdAt).toBeInstanceOf(Date);
      expect(result.transactions[0].createdAt?.getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
    });

    it('should return balance after transactions', async () => {
      // Arrange
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(1000, 'USD'));
      wallet.debit(new Money(400, 'USD'));

      const transactions = [
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.CREDIT,
          amount: 1000,
          currency: 'USD',
          balanceAfter: 1000,
        }),
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.DEBIT,
          amount: 400,
          currency: 'USD',
          balanceAfter: 600,
        }),
      ];

      mockWalletRepo.findById.mockResolvedValue(wallet);
      mockTxnRepo.findByWalletId.mockResolvedValue(transactions);

      // Act
      const result = await useCase.execute(wallet.id.value);

      // Assert
      expect(result.balance).toBe(600);
      expect(result.transactions[0].balanceAfter).toBe(1000);
      expect(result.transactions[1].balanceAfter).toBe(600);
    });

    it('should handle transactions with references', async () => {
      // Arrange
      const wallet = Wallet.create('USD');

      const transaction = Transaction.create({
        walletId: wallet.id.value,
        type: TransactionType.CREDIT,
        amount: 500,
        currency: 'USD',
        balanceAfter: 500,
        reference: 'Payment from client',
      });

      mockWalletRepo.findById.mockResolvedValue(wallet);
      mockTxnRepo.findByWalletId.mockResolvedValue([transaction]);

      // Act
      const result = await useCase.execute(wallet.id.value);

      // Assert
      expect(result.transactions[0].reference).toBe('Payment from client');
    });

    it('should handle transactions without references', async () => {
      // Arrange
      const wallet = Wallet.create('USD');

      const transaction = Transaction.create({
        walletId: wallet.id.value,
        type: TransactionType.CREDIT,
        amount: 500,
        currency: 'USD',
        balanceAfter: 500,
      });

      mockWalletRepo.findById.mockResolvedValue(wallet);
      mockTxnRepo.findByWalletId.mockResolvedValue([transaction]);

      // Act
      const result = await useCase.execute(wallet.id.value);

      // Assert
      expect(result.transactions[0].reference).toBeUndefined();
    });

    it('should include transaction IDs', async () => {
      // Arrange
      const wallet = Wallet.create('USD');

      const transaction = Transaction.create({
        walletId: wallet.id.value,
        type: TransactionType.CREDIT,
        amount: 500,
        currency: 'USD',
        balanceAfter: 500,
      });

      mockWalletRepo.findById.mockResolvedValue(wallet);
      mockTxnRepo.findByWalletId.mockResolvedValue([transaction]);

      // Act
      const result = await useCase.execute(wallet.id.value);

      // Assert
      expect(result.transactions[0].id).toBeDefined();
      expect(typeof result.transactions[0].id).toBe('string');
      expect(result.transactions[0].id.length).toBeGreaterThan(0);
    });

    it('should handle multiple transaction types in history', async () => {
      // Arrange
      const wallet = Wallet.create('USD');

      const transactions = [
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.CREDIT,
          amount: 1000,
          currency: 'USD',
          balanceAfter: 1000,
        }),
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.DEBIT,
          amount: 200,
          currency: 'USD',
          balanceAfter: 800,
        }),
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.TRANSFER_OUT,
          amount: 300,
          currency: 'USD',
          balanceAfter: 500,
          relatedWalletId: 'wallet-2',
        }),
        Transaction.create({
          walletId: wallet.id.value,
          type: TransactionType.CREDIT,
          amount: 100,
          currency: 'USD',
          balanceAfter: 600,
        }),
      ];

      mockWalletRepo.findById.mockResolvedValue(wallet);
      mockTxnRepo.findByWalletId.mockResolvedValue(transactions);

      // Act
      const result = await useCase.execute(wallet.id.value);

      // Assert
      expect(result.transactions).toHaveLength(4);
      expect(result.transactions[0].type).toBe('CREDIT');
      expect(result.transactions[1].type).toBe('DEBIT');
      expect(result.transactions[2].type).toBe('TRANSFER_OUT');
      expect(result.transactions[3].type).toBe('CREDIT');
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockWalletRepo.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('wallet-id')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
