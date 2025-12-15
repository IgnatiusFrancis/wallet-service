import { Test, TestingModule } from '@nestjs/testing';
import { Wallet } from '../../src/domain/entities/wallet.entity';
import { CreateWalletUseCase } from '@application/use-cases/create-wallet/create-wallet.use-case';
import { WALLET_REPOSITORY } from '@domain/repositories/wallet.interface';

describe('CreateWalletUseCase', () => {
  let useCase: CreateWalletUseCase;
  let mockWalletRepo: any;

  beforeEach(async () => {
    mockWalletRepo = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWalletUseCase,
        { provide: WALLET_REPOSITORY, useValue: mockWalletRepo },
      ],
    }).compile();

    useCase = module.get<CreateWalletUseCase>(CreateWalletUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a wallet with zero balance', async () => {
      // Arrange
      mockWalletRepo.save.mockImplementation((wallet: Wallet) =>
        Promise.resolve(wallet),
      );

      // Act
      const result = await useCase.execute({ currency: 'USD' });

      // Assert
      expect(result.id).toBeDefined();
      expect(result.currency).toBe('USD');
      expect(result.balance).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(mockWalletRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should generate unique wallet IDs', async () => {
      // Arrange
      mockWalletRepo.save.mockImplementation((wallet: Wallet) =>
        Promise.resolve(wallet),
      );

      // Act
      const wallet1 = await useCase.execute({ currency: 'USD' });
      const wallet2 = await useCase.execute({ currency: 'USD' });

      // Assert
      expect(wallet1.id).not.toBe(wallet2.id);
    });

    it('should create wallet with correct currency', async () => {
      // Arrange
      mockWalletRepo.save.mockImplementation((wallet: Wallet) =>
        Promise.resolve(wallet),
      );

      // Act
      const result = await useCase.execute({ currency: 'USD' });

      // Assert
      expect(result.currency).toBe('USD');
    });

    it('should call repository save method', async () => {
      // Arrange
      mockWalletRepo.save.mockImplementation((wallet: Wallet) =>
        Promise.resolve(wallet),
      );

      // Act
      await useCase.execute({ currency: 'USD' });

      // Assert
      expect(mockWalletRepo.save).toHaveBeenCalledTimes(1);
      const savedWallet = mockWalletRepo.save.mock.calls[0][0];
      expect(savedWallet).toBeInstanceOf(Wallet);
      expect(savedWallet.balance.amount).toBe(0);
      expect(savedWallet.balance.currency).toBe('USD');
    });

    it('should return wallet with creation timestamp', async () => {
      // Arrange
      const beforeCreation = new Date();
      mockWalletRepo.save.mockImplementation((wallet: Wallet) =>
        Promise.resolve(wallet),
      );

      // Act
      const result = await useCase.execute({ currency: 'USD' });
      const afterCreation = new Date();

      // Assert
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime(),
      );
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockWalletRepo.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute({ currency: 'USD' })).rejects.toThrow(
        'Database error',
      );
    });
  });
});
