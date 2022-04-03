import { Blockchain } from '@domain/blockchain';
import { RedisClientType } from 'redis';

export interface ChannelMessage {
  channel: string;
  message: string;
}

export interface PubSubModel {
  publisher: RedisClientType;
  subscriber: RedisClientType;
  blockchain: Blockchain;

  connect(): Promise<void>;
  handleMessage(channel: string, message: string): void;
  publish({ channel, message }: ChannelMessage): Promise<void>;
  broadcastChain(): Promise<void>;
}
