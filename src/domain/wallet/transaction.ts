import { Signature, verifySignature } from '@util';
import { v1 as uuid } from 'uuid';

import { OutputMapModel } from './transaction.model';

import { Wallet } from '.';

interface TransactionArgs {
  senderWallet: Wallet;
  recipient: string;
  amount: number;
}

interface TransactionInput {
  timestamp: number;
  amount: number;
  address: string;
  signature: Signature;
}

export class Transaction {
  id: string;
  outputMap: OutputMapModel;
  input: TransactionInput;

  constructor(transactionArgs: TransactionArgs) {
    this.id = uuid();
    this.outputMap = this.createOutputMap(transactionArgs);
    this.input = this.createInput({
      senderWallet: transactionArgs.senderWallet,
      outputMap: this.outputMap,
    });
  }

  createOutputMap({ senderWallet, recipient, amount }: TransactionArgs) {
    const outputMap = {
      [recipient]: amount,
      [senderWallet.publicKey]: senderWallet.balance - amount,
    };

    return outputMap;
  }

  createInput({
    senderWallet,
    outputMap,
  }: {
    senderWallet: Wallet;
    outputMap: OutputMapModel;
  }): TransactionInput {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap),
    };
  }

  update({ senderWallet, recipient, amount }) {
    if (amount > this.outputMap[senderWallet.publicKey]) {
      throw new Error('Amount exceeds balance');
    }

    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount;
    } else {
      this.outputMap[recipient] += amount;
    }

    this.outputMap[senderWallet.publicKey] -= amount;

    this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  static validTransaction(transaction) {
    const {
      input: { address, amount, signature },
      outputMap,
    } = transaction;

    const outputTotal = Object.values(outputMap).reduce(
      (total: number, outputAmount: number) => total + outputAmount
    );

    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}`);
      return false;
    }

    if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
      console.error(`Invalid signature from ${address}`);
      return false;
    }

    return true;
  }
}
