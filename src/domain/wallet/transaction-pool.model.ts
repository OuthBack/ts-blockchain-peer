import { Transaction } from './transaction';

export interface TransactionMap {
  [key: string]: Transaction;
}

export interface TransactionPoolModel {
  transactionMap: TransactionMap;
  setTransaction(transaction: Transaction): void;
  setMap(transactionMap: TransactionMap);
  existingTransaction(input: { inputAddress: string }): Transaction;
}
