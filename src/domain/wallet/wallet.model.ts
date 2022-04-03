import { KeyPair, Signature } from '@util/elliptic';

export interface WalletModel {
  keyPair: KeyPair;
  balance: number;
  publicKey: string;
  sign(data: string): Signature;
}
