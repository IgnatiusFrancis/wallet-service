import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class FundWalletDto {
  @IsString()
  walletId: string;

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

export class FundWalletResultDto {
  constructor(
    public readonly transactionId: string,
    public readonly walletId: string,
    public readonly amount: number,
    public readonly balanceAfter: number,
    public readonly reference: string | undefined,
    public readonly idempotencyKey: string | undefined,
    public readonly createdAt: Date,
  ) {}
}
