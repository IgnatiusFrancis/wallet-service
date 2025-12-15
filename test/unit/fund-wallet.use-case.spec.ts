import { Test, TestingModule } from '@nestjs/testing';
import { FundWalletUseCase } from '../../src/application/use-cases/fund-wallet/fund-wallet.use-case';
import { Wallet } from '../../src/domain/entities/wallet.entity';
import {
  WalletNotFoundException,
  InvalidAmountException,
} from '../../src/domain/exceptions/domain.exceptions';
import { Money } from '../../src/domain/value-objects/money.vo';
import { WALLET_REPOSITORY } from '@domain/repositories/wallet.interface';
import { TRANSACTION_REPOSITORY } from '@domain/repositories/transaction.interface';

describe('FundWalletUseCase', () => {
  let useCase: FundWalletUseCase;
  let mockWalletRepo: any;
  let mockTxnRepo: any;

  beforeEach(async () => {
    mockWalletRepo = {
      findByIdWithLock: jest.fn(),
      save: jest.fn(),
    };

    mockTxnRepo = {
      findByIdempotencyKey: jest.fn(),
      findByReference: jest.fn(), // ✅ REQUIRED
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundWalletUseCase,
        { provide: WALLET_REPOSITORY, useValue: mockWalletRepo },
        { provide: TRANSACTION_REPOSITORY, useValue: mockTxnRepo },
      ],
    }).compile();

    useCase = module.get<FundWalletUseCase>(FundWalletUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should fund wallet successfully', async () => {
      const wallet = Wallet.create('USD');

      mockWalletRepo.findByIdWithLock.mockResolvedValue(wallet);
      mockWalletRepo.save.mockResolvedValue(wallet);
      mockTxnRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTxnRepo.findByReference.mockResolvedValue(null);
      mockTxnRepo.save.mockResolvedValue({});

      const result = await useCase.execute({
        walletId: wallet.id.value,
        amount: 100,
      });

      expect(result.amount).toBe(100);
      expect(result.balanceAfter).toBe(100);
      expect(result.walletId).toBe(wallet.id.value);
      expect(result.transactionId).toBeDefined();

      expect(mockWalletRepo.save).toHaveBeenCalledTimes(1);
      expect(mockTxnRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error for non-existent wallet', async () => {
      mockWalletRepo.findByIdWithLock.mockResolvedValue(null);
      mockTxnRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTxnRepo.findByReference.mockResolvedValue(null);

      await expect(
        useCase.execute({ walletId: 'invalid', amount: 100 }),
      ).rejects.toThrow(WalletNotFoundException);

      expect(mockWalletRepo.save).not.toHaveBeenCalled();
    });

    it('should throw error for zero amount', async () => {
      await expect(
        useCase.execute({ walletId: 'any', amount: 0 }),
      ).rejects.toThrow(InvalidAmountException);
    });

    it('should throw error for negative amount', async () => {
      await expect(
        useCase.execute({ walletId: 'any', amount: -10 }),
      ).rejects.toThrow(InvalidAmountException);
    });

    it('should handle idempotency correctly', async () => {
      const existingTxn = {
        id: 'txn-1',
        walletId: 'wallet-1',
        amount: 100,
        balanceAfter: 100,
        reference: 'ref-1',
        createdAt: new Date(),
      };

      mockTxnRepo.findByIdempotencyKey.mockResolvedValue(existingTxn);

      const result = await useCase.execute({
        walletId: 'wallet-1',
        amount: 100,
        idempotencyKey: 'key-123',
      });

      expect(result.transactionId).toBe('txn-1');
      expect(mockWalletRepo.findByIdWithLock).not.toHaveBeenCalled();
      expect(mockWalletRepo.save).not.toHaveBeenCalled();
      expect(mockTxnRepo.save).not.toHaveBeenCalled();
    });

    it('should accumulate balance correctly', async () => {
      const wallet = Wallet.create('USD');
      wallet.credit(new Money(500, 'USD'));

      mockWalletRepo.findByIdWithLock.mockResolvedValue(wallet);
      mockWalletRepo.save.mockResolvedValue(wallet);
      mockTxnRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTxnRepo.findByReference.mockResolvedValue(null);
      mockTxnRepo.save.mockResolvedValue({});

      const result = await useCase.execute({
        walletId: wallet.id.value,
        amount: 300,
      });

      expect(result.balanceAfter).toBe(800);
    });

    it('should throw error when reference already exists', async () => {
      const existingTxn = {
        id: 'txn-ref-1',
        walletId: 'wallet-1',
        amount: 100,
        balanceAfter: 100,
        reference: 'REF-123',
        createdAt: new Date(),
      };

      mockTxnRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTxnRepo.findByReference.mockResolvedValue(existingTxn);

      await expect(
        useCase.execute({
          walletId: 'wallet-1',
          amount: 100,
          reference: 'REF-123',
        }),
      ).rejects.toThrow("Reference 'REF-123' has already been used");

      expect(mockWalletRepo.findByIdWithLock).not.toHaveBeenCalled();
      expect(mockWalletRepo.save).not.toHaveBeenCalled();
      expect(mockTxnRepo.save).not.toHaveBeenCalled();
    });

    it('should store reference when provided', async () => {
      const wallet = Wallet.create('USD');

      mockWalletRepo.findByIdWithLock.mockResolvedValue(wallet);
      mockWalletRepo.save.mockResolvedValue(wallet);
      mockTxnRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTxnRepo.findByReference.mockResolvedValue(null);
      mockTxnRepo.save.mockResolvedValue({});

      await useCase.execute({
        walletId: wallet.id.value,
        amount: 100,
        reference: 'Test reference',
      });

      const savedTxn = mockTxnRepo.save.mock.calls[0][0];
      expect(savedTxn.reference).toBe('Test reference');
    });
  });
});
