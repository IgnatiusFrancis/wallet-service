import { CreateWalletUseCase } from '../../src/application/use-cases/create-wallet/create-wallet.use-case';
import { FundWalletUseCase } from '../../src/application/use-cases/fund-wallet/fund-wallet.use-case';
import { TransferFundsUseCase } from '../../src/application/use-cases/transfer-funds/transfer-funds.use-case';
import { GetWalletUseCase } from '../../src/application/use-cases/get-wallet/get-wallet.use-case';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';

describe('Wallet Flow Integration Tests', () => {
  let module: TestingModule;
  let createWalletUseCase: CreateWalletUseCase;
  let fundWalletUseCase: FundWalletUseCase;
  let transferFundsUseCase: TransferFundsUseCase;
  let getWalletUseCase: GetWalletUseCase;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    createWalletUseCase = module.get<CreateWalletUseCase>(CreateWalletUseCase);
    fundWalletUseCase = module.get<FundWalletUseCase>(FundWalletUseCase);
    transferFundsUseCase =
      module.get<TransferFundsUseCase>(TransferFundsUseCase);
    getWalletUseCase = module.get<GetWalletUseCase>(GetWalletUseCase);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Complete wallet lifecycle', () => {
    it('should create, fund, transfer, and retrieve wallet', async () => {
      // 1. Create two wallets
      const wallet1 = await createWalletUseCase.execute({ currency: 'USD' });
      const wallet2 = await createWalletUseCase.execute({ currency: 'USD' });

      expect(wallet1.balance).toBe(0);
      expect(wallet2.balance).toBe(0);

      // 2. Fund wallet 1
      const fundResult = await fundWalletUseCase.execute({
        walletId: wallet1.id,
        amount: 1000,
        reference: 'Initial funding',
      });

      expect(fundResult.balanceAfter).toBe(1000);

      // 3. Transfer from wallet 1 to wallet 2
      const transferResult = await transferFundsUseCase.execute({
        fromWalletId: wallet1.id,
        toWalletId: wallet2.id,
        description: 'Test Description',
        amount: 400,
        reference: '123456789',
      });

      expect(transferResult.fromBalanceAfter).toBe(600);
      expect(transferResult.toBalanceAfter).toBe(400);

      // 4. Get wallet 1 details
      const wallet1Details = await getWalletUseCase.execute(wallet1.id);

      expect(wallet1Details.balance).toBe(600);
      expect(wallet1Details.transactions).toHaveLength(2); // Fund + Transfer out
      expect(wallet1Details.transactions[0].type).toBe('TRANSFER_OUT');
      expect(wallet1Details.transactions[1].type).toBe('CREDIT');

      // 5. Get wallet 2 details
      const wallet2Details = await getWalletUseCase.execute(wallet2.id);

      expect(wallet2Details.balance).toBe(400);
      expect(wallet2Details.transactions).toHaveLength(1); // Transfer in
      expect(wallet2Details.transactions[0].type).toBe('CREDIT');
    });

    it('should handle multiple operations correctly', async () => {
      // Create wallet
      const wallet = await createWalletUseCase.execute({ currency: 'USD' });

      // Multiple funding operations
      await fundWalletUseCase.execute({ walletId: wallet.id, amount: 100 });
      await fundWalletUseCase.execute({ walletId: wallet.id, amount: 200 });
      await fundWalletUseCase.execute({ walletId: wallet.id, amount: 300 });

      // Get wallet and verify
      const details = await getWalletUseCase.execute(wallet.id);

      expect(details.balance).toBe(600);
      expect(details.transactions).toHaveLength(3);
    });

    it('should handle idempotent operations', async () => {
      // Create and fund wallet
      const wallet = await createWalletUseCase.execute({ currency: 'USD' });

      // First funding with idempotency key
      const result1 = await fundWalletUseCase.execute({
        walletId: wallet.id,
        amount: 500,
        idempotencyKey: 'test-key-123',
      });

      // Duplicate request with same idempotency key
      const result2 = await fundWalletUseCase.execute({
        walletId: wallet.id,
        amount: 500,
        idempotencyKey: 'test-key-123',
      });

      // Should return same transaction
      expect(result1.transactionId).toBe(result2.transactionId);
      expect(result1.balanceAfter).toBe(result2.balanceAfter);

      // Balance should only be updated once
      const details = await getWalletUseCase.execute(wallet.id);
      expect(details.balance).toBe(500);
      expect(details.transactions).toHaveLength(1);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle concurrent funding correctly', async () => {
      // Create wallet
      const wallet = await createWalletUseCase.execute({ currency: 'USD' });

      // Concurrent funding operations
      await Promise.all([
        fundWalletUseCase.execute({ walletId: wallet.id, amount: 100 }),
        fundWalletUseCase.execute({ walletId: wallet.id, amount: 200 }),
        fundWalletUseCase.execute({ walletId: wallet.id, amount: 300 }),
      ]);

      // Verify final balance
      const details = await getWalletUseCase.execute(wallet.id);
      expect(details.balance).toBe(600);
      expect(details.transactions).toHaveLength(3);
    });

    it('should handle concurrent transfers correctly', async () => {
      // Create and fund source wallet
      const source = await createWalletUseCase.execute({ currency: 'USD' });
      await fundWalletUseCase.execute({ walletId: source.id, amount: 1000 });

      // Create target wallets
      const target1 = await createWalletUseCase.execute({ currency: 'USD' });
      const target2 = await createWalletUseCase.execute({ currency: 'USD' });
      const target3 = await createWalletUseCase.execute({ currency: 'USD' });

      // Concurrent transfers
      await Promise.all([
        transferFundsUseCase.execute({
          fromWalletId: source.id,
          toWalletId: target1.id,
          description: 'Transfer 1',
          amount: 200,
        }),
        transferFundsUseCase.execute({
          fromWalletId: source.id,
          toWalletId: target2.id,
          description: 'Transfer 2',
          amount: 300,
        }),
        transferFundsUseCase.execute({
          fromWalletId: source.id,
          toWalletId: target3.id,
          description: 'Transfer 3',
          amount: 100,
        }),
      ]);

      // Verify balances
      const sourceDetails = await getWalletUseCase.execute(source.id);
      expect(sourceDetails.balance).toBe(400); // 1000 - 200 - 300 - 100
    });
  });
});
