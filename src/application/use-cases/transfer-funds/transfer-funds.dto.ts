import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class TransferFundsDto {
  @IsString()
  fromWalletId: string;

  @IsString()
  toWalletId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class TransferFundsResultDto {
  constructor(
    public readonly debitTransactionId: string,
    public readonly creditTransactionId: string,
    public readonly fromWalletId: string,
    public readonly toWalletId: string,
    public readonly amount: number,
    public readonly fromBalanceAfter: number,
    public readonly toBalanceAfter: number,
    public readonly createdAt: Date,
  ) {}
}
