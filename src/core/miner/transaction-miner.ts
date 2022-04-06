import { Blockchain } from '@domain/blockchain';
import { Transaction, TransactionPool, Wallet } from '@domain/wallet';

import { PubSub } from '../pubsub';

import { TransactionMinerModel } from './transaction-miner.model';

export class TransactionMiner implements TransactionMinerModel {
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  wallet: Wallet;
  pubsub: PubSub;

  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  mineTransactions() {
    const validTransactions = this.transactionPool.validTransactions();

    validTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet })
    );

    this.blockchain.addBlock({ data: validTransactions });

    this.pubsub.broadcastChain();

    this.transactionPool.clear();
  }
}
