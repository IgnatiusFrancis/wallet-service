import { Injectable, Inject } from '@nestjs/common';
import { Wallet } from '@domain/entities/wallet.entity';
import {
  IWalletRepository,
  WALLET_REPOSITORY,
} from '@domain/repositories/wallet.interface';
import { CreateWalletDto, CreateWalletResultDto } from './create-wallet.dto';

@Injectable()
export class CreateWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepo: IWalletRepository,
  ) {}

  async execute(dto: CreateWalletDto): Promise<CreateWalletResultDto> {
    const wallet = Wallet.create(dto.currency);
    const savedWallet = await this.walletRepo.save(wallet);

    return new CreateWalletResultDto(
      savedWallet.id.value,
      savedWallet.balance.currency,
      savedWallet.balance.amount,
      savedWallet.createdAt,
    );
  }
}
