import { PubSub } from '@core/pubsub';
import { Blockchain } from '@domain/blockchain';
import { TransactionPool, Wallet } from '@domain/wallet';

export interface TransactionMinerModel {
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  wallet: Wallet;
  pubsub: PubSub;
  mineTransactions(): void;
}
