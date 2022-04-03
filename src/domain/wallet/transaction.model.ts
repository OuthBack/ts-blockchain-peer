import { Signature } from '@util/elliptic';

import { Wallet } from '.';

export interface CreateInputArgs {
  senderWallet: Wallet;
  outputMap: OutputMapModel;
}

export interface OutputMapModel {
  [key: string]: number;
}

export interface TransactionInput {
  timestamp?: number;
  amount?: number;
  address: string;
  signature?: Signature;
}

export interface TransactionArgs {
  senderWallet: Wallet;
  recipient: string;
  amount: number;
  outputMap?: OutputMapModel;
  input?: { address: string };
}

export interface TransactionModel {
  id: string;
  outputMap: OutputMapModel;
  input: TransactionInput;
  createOutputMap(input: TransactionArgs): { [x: string]: number };
  createInput(input: CreateInputArgs): TransactionInput;
  update(input: TransactionArgs): void;
}
