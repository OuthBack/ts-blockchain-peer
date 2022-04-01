import { Blockchain } from '@domain';
import { createClient, RedisClientType } from 'redis';

import { ChannelMessage, PubSubModel } from './pubsub.model';

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
};

export class PubSub implements PubSubModel {
  publisher: RedisClientType;
  subscriber: RedisClientType;
  blockchain: Blockchain;

  constructor({ blockchain }: { blockchain: Blockchain }) {
    // Needs to connect before make publishes
    this.blockchain = blockchain;

    const client: RedisClientType = createClient();
    this.publisher = client.duplicate();
    this.subscriber = client.duplicate();
  }

  async connect() {
    this.publisher.connect();
    this.subscriber.connect();
  }

  handleMessage(message: string, channel: string) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`);

    const parsedMessage = JSON.parse(message);

    if (channel === CHANNELS.BLOCKCHAIN) {
      this.blockchain.replaceChain(parsedMessage);
    }
  }

  async publish({ message, channel }: ChannelMessage) {
    await this.subscriber.unsubscribe(channel);
    await this.publisher.publish(channel, message);
    await this.subscriber.subscribe(channel, () =>
      this.handleMessage(message, channel)
    );
  }

  async broadcastChain() {
    await this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }
}
