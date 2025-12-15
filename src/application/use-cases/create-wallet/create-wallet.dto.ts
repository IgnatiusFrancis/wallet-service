import { IsString, IsIn } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsIn(['USD'])
  currency: string;
}

export class CreateWalletResultDto {
  constructor(
    public readonly id: string,
    public readonly currency: string,
    public readonly balance: number,
    public readonly createdAt: Date,
  ) {}
}
