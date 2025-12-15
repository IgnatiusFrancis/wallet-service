import { Injectable, Inject } from '@nestjs/common';
import {
  WalletNotFoundException,
  InvalidAmountException,
} from '@domain/exceptions/domain.exceptions';
import { Money } from '@domain/value-objects/money.vo';
import { FundWalletDto, FundWalletResultDto } from './fund-wallet.dto';
import {
  IWalletRepository,
  WALLET_REPOSITORY,
} from '@domain/repositories/wallet.interface';
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from '@domain/repositories/transaction.interface';

@Injectable()
export class FundWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepo: IWalletRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly txnRepo: ITransactionRepository,
  ) {}

  async execute(dto: FundWalletDto): Promise<FundWalletResultDto> {
    if (dto.amount <= 0) {
      throw new InvalidAmountException(dto.amount);
    }

    // Check idempotency
    if (dto.idempotencyKey) {
      const existingTxn = await this.txnRepo.findByIdempotencyKey(
        dto.idempotencyKey,
      );
      if (existingTxn) {
        return new FundWalletResultDto(
          existingTxn.id,
          existingTxn.walletId,
          existingTxn.amount,
          existingTxn.balanceAfter,
          existingTxn.createdAt,
        );
      }
    }

    const wallet = await this.walletRepo.findByIdWithLock(dto.walletId);
    if (!wallet) {
      throw new WalletNotFoundException(dto.walletId);
    }

    const money = new Money(dto.amount, wallet.balance.currency);
    const txn = wallet.credit(money, dto.idempotencyKey, dto.reference);

    await this.walletRepo.save(wallet);
    await this.txnRepo.save(txn);

    return new FundWalletResultDto(
      txn.id,
      txn.walletId,
      txn.amount,
      txn.balanceAfter,
      txn.createdAt,
    );
  }
}
