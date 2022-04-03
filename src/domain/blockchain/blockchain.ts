import { Transaction } from '@domain/wallet';
import { cryptoHash } from '@util/crypto-hash';

import { Block } from '../block';

import { BlockchainModel } from './blockchain.model';

export class Blockchain implements BlockchainModel {
  chain: Block[];

  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }: Pick<Block, 'data'> | { data: Transaction[] }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data,
    });

    this.chain.push(newBlock);
  }

  replaceChain(chain: Block[], onSuccess?: (args?: unknown) => void) {
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');
      return;
    }

    if (onSuccess) {
      onSuccess();
    }
    console.log('replacing chain with');
    this.chain = chain;
  }

  static isValidChain(chain: Block[]): boolean {
    return chain.every((block, i) => {
      if (i === 0) {
        return JSON.stringify(block) === JSON.stringify(Block.genesis());
      }

      const { data, hash, lastHash, timestamp, difficulty, nounce } = block;
      const actualLastHash = chain[i - 1].hash;
      const lastDifficulty = chain[i - 1].difficulty;

      if (lastHash !== actualLastHash) {
        return false;
      }

      if (Math.abs(lastDifficulty - difficulty) > 1) {
        return false;
      }

      const validatedHash = cryptoHash(
        timestamp,
        lastHash,
        data,
        nounce,
        difficulty
      );

      if (hash !== validatedHash) {
        return false;
      }

      return true;
    });
  }
}
