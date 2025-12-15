import { Test, TestingModule } from '@nestjs/testing';
import { TransferFundsUseCase } from '../../src/application/use-cases/transfer-funds/transfer-funds.use-case';
import { Wallet } from '../../src/domain/entities/wallet.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import {
  InsufficientFundsException,
  CurrencyMismatchException,
  InvalidAmountException,
  WalletNotFoundException,
} from '../../src/domain/exceptions/domain.exceptions';
import { WALLET_REPOSITORY } from '../../src/domain/repositories/wallet.interface';
import { TRANSACTION_REPOSITORY } from '../../src/domain/repositories/transaction.interface';

describe('TransferFundsUseCase', () => {
  let useCase: TransferFundsUseCase;
  let mockWalletRepo: any;
  let mockTxnRepo: any;

  beforeEach(async () => {
    mockWalletRepo = {
      findMultipleByIdsWithLock: jest.fn(),
      save: jest.fn(),
    };

    mockTxnRepo = {
      findByIdempotencyKey: jest.fn(),
      save: jest.fn(),
      findByWalletId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferFundsUseCase,
        { provide: WALLET_REPOSITORY, useValue: mockWalletRepo },
        { provide: TRANSACTION_REPOSITORY, useValue: mockTxnRepo },
      ],
    }).compile();

    useCase = module.get<TransferFundsUseCase>(TransferFundsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should transfer funds successfully', async () => {
      // Arrange
      const sender = Wallet.create('USD');
      sender.credit(new Money(200, 'USD'));

      const receiver = Wallet.create('USD');

      const walletsMap = new Map([
        [sender.id.value, sender],
        [receiver.id.value, receiver],
      ]);

      mockWalletRepo.findMultipleByIdsWithLock.mockResolvedValue(walletsMap);
      mockTxnRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockWalletRepo.save.mockResolvedValue(undefined);
      mockTxnRepo.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute({
        fromWalletId: sender.id.value,
        toWalletId: receiver.id.value,
        amount: 100,
        description: 'Test transfer',
      });

      // Assert
      expect(result.amount).toBe(100);
      expect(result.fromBalanceAfter).toBe(100);
      expect(result.toBalanceAfter).toBe(100);
      expect(result.debitTransactionId).toBeDefined();
      expect(result.creditTransactionId).toBeDefined();

      expect(mockWalletRepo.save).toHaveBeenCalledTimes(2);
      expect(mockTxnRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should throw InvalidAmountException for zero or negative amount', async () => {
      await expect(
        useCase.execute({
          fromWalletId: 'wallet-1',
          toWalletId: 'wallet-2',
          description: 'Test transfer',
          amount: 0,
        }),
      ).rejects.toThrow(InvalidAmountException);
    });

    it('should throw WalletNotFoundException if sender wallet does not exist', async () => {
      const receiver = Wallet.create('USD');

      mockWalletRepo.findMultipleByIdsWithLock.mockResolvedValue(
        new Map([[receiver.id.value, receiver]]),
      );

      await expect(
        useCase.execute({
          fromWalletId: 'missing-wallet',
          toWalletId: receiver.id.value,
          description: 'Test transfer',
          amount: 50,
        }),
      ).rejects.toThrow(WalletNotFoundException);
    });

    it('should throw WalletNotFoundException if receiver wallet does not exist', async () => {
      const sender = Wallet.create('USD');
      sender.credit(new Money(100, 'USD'));

      mockWalletRepo.findMultipleByIdsWithLock.mockResolvedValue(
        new Map([[sender.id.value, sender]]),
      );

      await expect(
        useCase.execute({
          fromWalletId: sender.id.value,
          toWalletId: 'missing-wallet',
          description: 'Test transfer',
          amount: 50,
        }),
      ).rejects.toThrow(WalletNotFoundException);
    });

    it('should throw CurrencyMismatchException if wallet currencies differ', async () => {
      const sender = Wallet.create('USD');
      sender.credit(new Money(100, 'USD'));

      const receiver = Wallet.create('EUR');

      mockWalletRepo.findMultipleByIdsWithLock.mockResolvedValue(
        new Map([
          [sender.id.value, sender],
          [receiver.id.value, receiver],
        ]),
      );

      await expect(
        useCase.execute({
          fromWalletId: sender.id.value,
          toWalletId: receiver.id.value,
          description: 'Test transfer',
          amount: 50,
        }),
      ).rejects.toThrow(CurrencyMismatchException);
    });

    it('should throw InsufficientFundsException if balance is not enough', async () => {
      const sender = Wallet.create('USD');
      sender.credit(new Money(30, 'USD'));

      const receiver = Wallet.create('USD');

      mockWalletRepo.findMultipleByIdsWithLock.mockResolvedValue(
        new Map([
          [sender.id.value, sender],
          [receiver.id.value, receiver],
        ]),
      );

      await expect(
        useCase.execute({
          fromWalletId: sender.id.value,
          toWalletId: receiver.id.value,
          description: 'Test transfer',
          amount: 100,
        }),
      ).rejects.toThrow(InsufficientFundsException);

      expect(mockWalletRepo.save).not.toHaveBeenCalled();
      expect(mockTxnRepo.save).not.toHaveBeenCalled();
    });

    it('should prevent transfer to the same wallet', async () => {
      const wallet = Wallet.create('USD');

      await expect(
        useCase.execute({
          fromWalletId: wallet.id.value,
          toWalletId: wallet.id.value,
          description: 'Test transfer',
          amount: 10,
        }),
      ).rejects.toThrow('Cannot transfer to the same wallet');
    });
  });
});
