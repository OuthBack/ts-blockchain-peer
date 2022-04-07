import { Blockchain } from '@domain/blockchain';
import { KeyPair, Signature } from '@util/elliptic';

import { Transaction } from './transaction';

export interface CreateTransactionArgs
  extends Partial<Pick<Blockchain, 'chain'>> {
  recipient: string;
  amount: number;
}

export interface CalculateBalanceArgs extends Pick<Blockchain, 'chain'> {
  address: string;
}

export interface WalletModel {
  keyPair: KeyPair;
  balance: number;
  publicKey: string;
  sign(data: string): Signature;
  createTransaction(input: CreateTransactionArgs): Transaction;
}
