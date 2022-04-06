import { STARTING_BALANCE } from '@configs';
import { cryptoHash } from '@util/crypto-hash';
import { ec, KeyPair, Signature } from '@util/elliptic';

import { WalletModel } from './wallet.model';

import { CalculateBalanceArgs, CreateTransactionArgs, Transaction } from '.';

export class Wallet implements WalletModel {
  keyPair: KeyPair;
  balance: number;
  publicKey: string;

  constructor() {
    this.balance = STARTING_BALANCE;

    this.keyPair = ec.genKeyPair();

    this.publicKey = this.keyPair.getPublic().encode('hex', false);
  }

  sign<DataType>(data: DataType): Signature {
    return this.keyPair.sign(cryptoHash(data));
  }

  createTransaction({
    recipient,
    amount,
    chain,
  }: CreateTransactionArgs): Transaction {
    if (chain) {
      this.balance = Wallet.calculateBalance({
        chain,
        address: this.publicKey,
      });
    }

    if (amount > this.balance) {
      throw new Error('Amount exceeds balance');
    }

    return new Transaction({ senderWallet: this, recipient, amount });
  }

  static calculateBalance({ chain, address }: CalculateBalanceArgs) {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (const block of chain.reverse()) {
      for (const transactionData of block.data) {
        const transaction = <Transaction>transactionData;

        if (transaction.input.address === address) {
          hasConductedTransaction = true;
        }

        const addressOutput = transaction.outputMap[address];

        if (addressOutput) {
          outputsTotal = outputsTotal + addressOutput;
        }
      }
      if (hasConductedTransaction) {
        break;
      }
    }
    return hasConductedTransaction
      ? outputsTotal
      : STARTING_BALANCE + outputsTotal;
  }
}
