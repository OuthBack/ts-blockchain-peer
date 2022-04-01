import { ec as EC } from 'elliptic';

import { cryptoHash } from '../crypto-hash';

interface VerifySignatureArgs<DataType> {
  publicKey: string;
  data: DataType;
  signature: Signature;
}

export type KeyPair = EC.KeyPair;
export type Signature = EC.Signature;

export const ec = new EC('secp256k1');
export const verifySignature = <DataType>({
  publicKey,
  data,
  signature,
}: VerifySignatureArgs<DataType>): boolean => {
  const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');
  return keyFromPublic.verify(cryptoHash(data), signature);
};
