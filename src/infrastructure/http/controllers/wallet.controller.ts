import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { CreateWalletUseCase } from '@application/use-cases/create-wallet/create-wallet.use-case';
import { FundWalletUseCase } from '@application/use-cases/fund-wallet/fund-wallet.use-case';
import { TransferFundsUseCase } from '@application/use-cases/transfer-funds/transfer-funds.use-case';
import { GetWalletUseCase } from '@application/use-cases/get-wallet/get-wallet.use-case';
import { CreateWalletDto } from '@application/use-cases/create-wallet/create-wallet.dto';
import { FundWalletDto } from '@application/use-cases/fund-wallet/fund-wallet.dto';
import { TransferFundsDto } from '@application/use-cases/transfer-funds/transfer-funds.dto';

@Controller('wallets')
export class WalletController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly fundWalletUseCase: FundWalletUseCase,
    private readonly transferFundsUseCase: TransferFundsUseCase,
    private readonly getWalletUseCase: GetWalletUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWallet(@Body(ValidationPipe) dto: CreateWalletDto) {
    return await this.createWalletUseCase.execute(dto);
  }

  @Post('fund')
  @HttpCode(HttpStatus.OK)
  async fundWallet(@Body(ValidationPipe) dto: FundWalletDto) {
    return await this.fundWalletUseCase.execute(dto);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transferFunds(@Body(ValidationPipe) dto: TransferFundsDto) {
    return await this.transferFundsUseCase.execute(dto);
  }

  @Get(':walletId')
  async getWallet(@Param('walletId') walletId: string) {
    return await this.getWalletUseCase.execute(walletId);
  }
}
