import { v4 as uuidv4 } from 'uuid';
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
          existingTxn.reference,
          existingTxn.idempotencyKey,
          existingTxn.createdAt,
        );
      }
    }

    if (dto.reference) {
      const existingReferenceTxn = await this.txnRepo.findByReference(
        dto.reference,
      );
      if (existingReferenceTxn) {
        throw new Error(`Reference '${dto.reference}' has already been used`);
      }
    }

    const wallet = await this.walletRepo.findByIdWithLock(dto.walletId);
    if (!wallet) {
      throw new WalletNotFoundException(dto.walletId);
    }
    // Generate a unique reference if not provided
    const transferReference = dto.reference ?? uuidv4();
    const money = new Money(dto.amount, wallet.balance.currency);
    const txn = wallet.credit(money, dto.idempotencyKey, transferReference);

    await this.walletRepo.save(wallet);
    await this.txnRepo.save(txn);

    return new FundWalletResultDto(
      txn.id,
      txn.walletId,
      txn.amount,
      txn.balanceAfter,
      transferReference,
      txn.idempotencyKey,
      txn.createdAt,
    );
  }
}
