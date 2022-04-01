import { BlockModel } from '@domain';

export const INITIAL_DIFFICULTY = 3;
export const MINE_RATE = 1000;
export const GENESIS_DATA: BlockModel = {
  data: '',
  hash: 'HASH 1',
  lastHash: '------',
  timestamp: 1,
  difficulty: INITIAL_DIFFICULTY,
  nounce: 0,
};

export const STARTING_BALANCE = 1000;
