import { Injectable, Inject } from '@nestjs/common';
import {
  WalletNotFoundException,
  InsufficientFundsException,
  CurrencyMismatchException,
  InvalidAmountException,
} from '@domain/exceptions/domain.exceptions';
import { Money } from '@domain/value-objects/money.vo';
import { TransactionType } from '@domain/entities/transaction.entity';
import { TransferFundsDto, TransferFundsResultDto } from './transfer-funds.dto';
import {
  IWalletRepository,
  WALLET_REPOSITORY,
} from '@domain/repositories/wallet.interface';
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from '@domain/repositories/transaction.interface';

@Injectable()
export class TransferFundsUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepo: IWalletRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly txnRepo: ITransactionRepository,
  ) {}

  async execute(dto: TransferFundsDto): Promise<TransferFundsResultDto> {
    if (dto.amount <= 0) {
      throw new InvalidAmountException(dto.amount);
    }

    if (dto.fromWalletId === dto.toWalletId) {
      throw new Error('Cannot transfer to the same wallet');
    }

    // Check idempotency
    if (dto.idempotencyKey) {
      const existingTxn = await this.txnRepo.findByIdempotencyKey(
        dto.idempotencyKey,
      );
      if (existingTxn && existingTxn.type === TransactionType.TRANSFER_OUT) {
        const creditTxn = (
          await this.txnRepo.findByWalletId(dto.toWalletId)
        ).find(
          (t) =>
            t.relatedWalletId === dto.fromWalletId &&
            Math.abs(t.createdAt.getTime() - existingTxn.createdAt.getTime()) <
              1000,
        );

        if (creditTxn) {
          return new TransferFundsResultDto(
            existingTxn.id,
            creditTxn.id,
            dto.fromWalletId,
            dto.toWalletId,
            dto.amount,
            existingTxn.balanceAfter,
            creditTxn.balanceAfter,
            existingTxn.createdAt,
          );
        }
      }
    }

    // Fetch both wallets with locks
    const ids = [dto.fromWalletId, dto.toWalletId].sort();
    const wallets = await this.walletRepo.findMultipleByIdsWithLock(ids);

    const fromWallet = wallets.get(dto.fromWalletId);
    const toWallet = wallets.get(dto.toWalletId);

    if (!fromWallet) {
      throw new WalletNotFoundException(dto.fromWalletId);
    }
    if (!toWallet) {
      throw new WalletNotFoundException(dto.toWalletId);
    }

    if (fromWallet.balance.currency !== toWallet.balance.currency) {
      throw new CurrencyMismatchException(
        fromWallet.balance.currency,
        toWallet.balance.currency,
      );
    }

    const transferAmount = new Money(dto.amount, fromWallet.balance.currency);

    if (!fromWallet.balance.isGreaterThanOrEqual(transferAmount)) {
      throw new InsufficientFundsException(dto.fromWalletId);
    }

    // Debit from sender
    const debitTxn = fromWallet.debit(
      transferAmount,
      dto.idempotencyKey,
      dto.reference,
      dto.toWalletId,
    );

    // Credit to receiver
    const creditTxn = toWallet.credit(transferAmount, undefined, dto.reference);

    // Save both wallets and transactions
    await Promise.all([
      this.walletRepo.save(fromWallet),
      this.walletRepo.save(toWallet),
      this.txnRepo.save(debitTxn),
      this.txnRepo.save(creditTxn),
    ]);

    return new TransferFundsResultDto(
      debitTxn.id,
      creditTxn.id,
      dto.fromWalletId,
      dto.toWalletId,
      dto.amount,
      debitTxn.balanceAfter,
      creditTxn.balanceAfter,
      debitTxn.createdAt,
    );
  }
}
