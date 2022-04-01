import { STARTING_BALANCE } from '@configs';
import { cryptoHash, ec, KeyPair, Signature } from '@util';

import { WalletModel } from './wallet.model';

import { Transaction } from '.';

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

  createTransaction({ recipient, amount }) {
    if (amount > this.balance) {
      throw new Error('Amount exceeds balance');
    }

    return new Transaction({ senderWallet: this, recipient, amount });
  }
}
