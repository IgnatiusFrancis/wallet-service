import { Injectable, Inject } from '@nestjs/common';
import { WalletNotFoundException } from '@domain/exceptions/domain.exceptions';
import {
  IWalletRepository,
  WALLET_REPOSITORY,
} from '@domain/repositories/wallet.interface';
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from '@domain/repositories/transaction.interface';

export class WalletDetailsDto {
  constructor(
    public readonly id: string,
    public readonly currency: string,
    public readonly balance: number,
    public readonly createdAt: Date,
    public readonly transactions: TransactionDto[],
  ) {}
}

export class TransactionDto {
  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly amount: number,
    public readonly balanceAfter: number,
    public readonly reference?: string,
    public readonly relatedWalletId?: string,
    public readonly createdAt?: Date,
  ) {}
}

@Injectable()
export class GetWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepo: IWalletRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly txnRepo: ITransactionRepository,
  ) {}

  async execute(walletId: string): Promise<WalletDetailsDto> {
    const wallet = await this.walletRepo.findById(walletId);
    if (!wallet) {
      throw new WalletNotFoundException(walletId);
    }

    const transactions = await this.txnRepo.findByWalletId(walletId);

    return new WalletDetailsDto(
      wallet.id.value,
      wallet.balance.currency,
      wallet.balance.amount,
      wallet.createdAt,
      transactions.map(
        (t) =>
          new TransactionDto(
            t.id,
            t.type,
            t.amount,
            t.balanceAfter,
            t.reference,
            t.relatedWalletId,
            t.createdAt,
          ),
      ),
    );
  }
}
