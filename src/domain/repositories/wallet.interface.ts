import { Wallet } from '../entities/wallet.entity';

export interface IWalletRepository {
  save(wallet: Wallet): Promise<Wallet>;
  findById(id: string): Promise<Wallet | null>;
  findByIdWithLock(id: string): Promise<Wallet | null>;
  findMultipleByIdsWithLock(ids: string[]): Promise<Map<string, Wallet>>;
}

export const WALLET_REPOSITORY = Symbol('WALLET_REPOSITORY');
