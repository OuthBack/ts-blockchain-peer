import { GENESIS_DATA, MINE_RATE } from '@configs';
import { Transaction } from '@domain/wallet';
import { cryptoHash } from '@util/crypto-hash';
import hexToBinary from 'hex-to-binary';

import { BlockModel } from './block.model';

interface MineBlockArgs {
  data: string | Transaction[];
  lastBlock: BlockModel;
}

interface AdjustDifficultyArgs extends Partial<Pick<BlockModel, 'timestamp'>> {
  originalBlock: BlockModel;
}
export class Block implements BlockModel {
  timestamp: number;
  hash: string;
  lastHash: string;
  data: string | Transaction[];
  nounce: number;
  difficulty: number;

  constructor({
    timestamp,
    lastHash,
    data,
    hash,
    difficulty,
    nounce,
  }: BlockModel) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.data = data;
    this.hash = hash;
    this.nounce = nounce;
    this.difficulty = difficulty;
  }

  static genesis(): BlockModel {
    return new this(GENESIS_DATA);
  }

  static mineBlock({ lastBlock, data }: MineBlockArgs): BlockModel {
    const lastHash = lastBlock.hash;
    let hash: string;
    let timestamp: number;

    let { difficulty } = lastBlock;

    let nounce = 0;

    do {
      nounce++;
      timestamp = Date.now();
      difficulty = Block.ajustDifficulty({
        originalBlock: lastBlock,
        timestamp,
      });
      hash = cryptoHash(timestamp, lastHash, data, nounce, difficulty);
    } while (
      hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty)
    );

    return new this({
      timestamp,
      lastHash,
      data: <string>data,
      difficulty,
      nounce,
      hash,
    });
  }

  static ajustDifficulty({ originalBlock, timestamp }: AdjustDifficultyArgs) {
    const { difficulty } = originalBlock;

    const difference = timestamp - originalBlock.timestamp;

    if (difficulty < 1) {
      return 1;
    }

    if (difference > MINE_RATE) {
      return difficulty - 1;
    }

    return difficulty + 1;
  }
}
