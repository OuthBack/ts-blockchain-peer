import { MINING_REWARD, REWARD_INPUT } from '@configs';
import { verifySignature } from '@util/elliptic';
import { v1 as uuid } from 'uuid';

import { OutputMapModel } from './transaction.model';
import {
  CreateInputArgs,
  TransactionArgs,
  TransactionInput,
  TransactionModel,
} from './transaction.model';

type CreateTransactionArgs = Omit<TransactionArgs, 'outputMap' | 'input'>;

export class Transaction implements TransactionModel {
  id: string;
  outputMap: OutputMapModel;
  input: TransactionInput;

  constructor(transactionArgs: Partial<TransactionArgs>) {
    const requiredArgs = <CreateTransactionArgs>transactionArgs;

    this.id = uuid();
    this.outputMap =
      transactionArgs.outputMap || this.createOutputMap(requiredArgs);
    this.input =
      transactionArgs.input ||
      this.createInput({
        senderWallet: transactionArgs.senderWallet,
        outputMap: this.outputMap,
      });
  }

  createOutputMap({ senderWallet, recipient, amount }: CreateTransactionArgs) {
    const outputMap = {
      [recipient]: amount,
      [senderWallet.publicKey]: senderWallet.balance - amount,
    };

    return outputMap;
  }

  createInput({ senderWallet, outputMap }: CreateInputArgs): TransactionInput {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap),
    };
  }

  update({ senderWallet, recipient, amount }: TransactionArgs) {
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

  static validTransaction(transaction: Transaction): boolean {
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

  static rewardTransaction({ minerWallet }) {
    return new this({
      input: REWARD_INPUT,
      outputMap: { [minerWallet.publicKey]: MINING_REWARD },
    });
  }
}
