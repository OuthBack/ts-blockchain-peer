import { Block } from './block';

const block = new Block({
  timestamp: Date.now(),
  data: 'OuthBack 10 BTC =>Addon',
  lastHash: 'bbbbbbbb',
  hash: '01',
});

console.log(block);
