import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

// Use Cases
import { CreateWalletUseCase } from './application/use-cases/create-wallet/create-wallet.use-case';
import { FundWalletUseCase } from './application/use-cases/fund-wallet/fund-wallet.use-case';
import { TransferFundsUseCase } from './application/use-cases/transfer-funds/transfer-funds.use-case';
import { GetWalletUseCase } from './application/use-cases/get-wallet/get-wallet.use-case';

// Controllers
import { WalletController } from './infrastructure/http/controllers/wallet.controller';

// Filters
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter';

// Repositories
import { WALLET_REPOSITORY } from '@domain/repositories/wallet.interface';
import { InMemoryWalletRepository } from '@infrastructure/persistence/wallet.repository';
import { TRANSACTION_REPOSITORY } from '@domain/repositories/transaction.interface';
import { InMemoryTransactionRepository } from '@infrastructure/persistence/transaction.repository';
import { AppController } from './app.controller';

@Module({
  controllers: [WalletController, AppController],
  providers: [
    // Use Cases
    CreateWalletUseCase,
    FundWalletUseCase,
    TransferFundsUseCase,
    GetWalletUseCase,

    // Repositories
    {
      provide: WALLET_REPOSITORY,
      useClass: InMemoryWalletRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: InMemoryTransactionRepository,
    },

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
