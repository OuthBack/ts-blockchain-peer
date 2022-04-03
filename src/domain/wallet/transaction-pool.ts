import { Blockchain } from '@domain/blockchain';

import { TransactionMap, TransactionPoolModel } from './transaction-pool.model';

import { Transaction } from '.';

export class TransactionPool implements TransactionPoolModel {
  transactionMap: TransactionMap;

  constructor() {
    this.transactionMap = {};
  }

  clear() {
    this.transactionMap = {};
  }

  setTransaction(transaction: Transaction) {
    this.transactionMap[transaction.id] = transaction;
  }

  setMap(transactionMap: TransactionMap) {
    this.transactionMap = transactionMap;
  }

  existingTransaction({ inputAddress }): Transaction {
    const transactions = Object.values(this.transactionMap);

    return transactions.find(
      (transaction) => transaction.input.address === inputAddress
    );
  }

  validTransactions(): Transaction[] {
    return Object.values(this.transactionMap).filter((transaction) =>
      Transaction.validTransaction(transaction)
    );
  }

  clearBlockchainTransactions({ chain }: Pick<Blockchain, 'chain'>) {
    chain.forEach((block) => {
      for (const dataTransaction of block.data) {
        const transaction = <Transaction>dataTransaction;

        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];
        }
      }
    });
  }
}
