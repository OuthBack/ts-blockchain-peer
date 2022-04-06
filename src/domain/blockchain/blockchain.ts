import { MINING_REWARD, REWARD_INPUT } from '@configs';
import { Transaction, Wallet } from '@domain/wallet';
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

  replaceChain(
    chain: Block[],
    validateTransactions?: boolean,
    onSuccess?: (args?: unknown) => void
  ) {
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');
      return;
    }

    if (validateTransactions && !this.validTransactionData({ chain })) {
      console.error('The incoming chain has invalid data');
      return;
    }

    if (onSuccess) {
      onSuccess();
    }
    console.log('replacing chain with');
    this.chain = chain;
  }

  validTransactionData({ chain }: { chain: Block[] }) {
    for (const block of chain) {
      const transactionSet: Set<Transaction> = new Set();
      let rewardTransactionCount = 0;

      for (const transactionData of block.data) {
        const transaction = <Transaction>transactionData;

        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          if (rewardTransactionCount > 1) {
            console.error('Miner rewards exceed limit');
            return false;
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amount is invalid');
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            console.error('Invalid transaction');
            return false;
          }

          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address,
          });

          if (transaction.input.amount !== trueBalance) {
            console.error('Invalid input amount');
            return false;
          }

          if (transactionSet.has(transaction)) {
            console.error(
              'An identical transaction appears more than once in the block'
            );
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }

    return true;
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
