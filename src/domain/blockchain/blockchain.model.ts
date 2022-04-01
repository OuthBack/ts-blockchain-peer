import { Block } from 'domain/block';

export interface BlockchainModel {
  chain: Block[];
  addBlock({ data }: Pick<Block, 'data'>): void;
  replaceChain(chain: Block[]): void;
}
