import { Transaction } from '@domain/wallet';

export interface BlockModel {
  timestamp: number;
  hash: string;
  lastHash: string;
  data: string | Transaction[];
  nounce: number;
  difficulty: number;
}
