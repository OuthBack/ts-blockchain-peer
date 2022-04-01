import { KeyPair, Signature } from '@util';

export interface WalletModel {
  keyPair: KeyPair;
  balance: number;
  publicKey: string;
  sign(data: string): Signature;
}
