import { Block } from '@block';
import { cryptoHash } from '@hash';

import { BlockchainModel } from './blockchain.model';

export class Blockchain implements BlockchainModel {
  chain: Block[];

  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }: Pick<Block, 'data'>) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data,
    });

    this.chain.push(newBlock);
  }

  replaceChain(chain: Block[]) {
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');
      return;
    }

    console.log('replacing chain with');
    this.chain = chain;
  }

  static isValidChain(chain: Block[]): boolean {
    return chain.every((block, i) => {
      if (i === 0) {
        return JSON.stringify(block) === JSON.stringify(Block.genesis());
      }

      const { data, hash, lastHash, timestamp } = block;

      const actualLastHash = chain[i - 1].hash;
      if (lastHash !== actualLastHash) {
        return false;
      }

      const validatedHash = cryptoHash(timestamp, lastHash, data);

      if (hash !== validatedHash) {
        return false;
      }

      return true;
    });
  }
}
