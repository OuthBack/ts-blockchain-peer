import { cryptoHash } from '@hash';

import { BlockModel } from './block.model';

interface MineBlockArgs extends Pick<BlockModel, 'data'> {
  lastBlock: BlockModel;
}

export const GENESIS_DATA: BlockModel = {
  data: '',
  hash: '01',
  lastHash: '00',
  timestamp: 1516,
};

export class Block implements BlockModel {
  timestamp: number;
  hash: string;
  lastHash: string;
  data: string;

  constructor({ timestamp, lastHash, data, hash }: BlockModel) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.data = data;
    this.hash = hash;
  }

  static genesis(): BlockModel {
    return new this(GENESIS_DATA);
  }

  static mineBlock({ lastBlock, data }: MineBlockArgs): BlockModel {
    const timestamp = Date.now();
    const lastHash = lastBlock.hash;

    return new this({
      timestamp,
      lastHash,
      hash: cryptoHash(timestamp, lastHash, data),
      data,
    });
  }
}
