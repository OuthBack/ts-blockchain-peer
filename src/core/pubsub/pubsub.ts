import { Blockchain } from '@domain/blockchain';
import { Transaction, TransactionPool } from '@domain/wallet';
import { createClient, RedisClientType } from 'redis';

import { ChannelMessage, PubSubModel } from './pubsub.model';

interface PubSubParameters {
  redisUrl: string;
  blockchain: Blockchain;
  transactionPool: TransactionPool;
}

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

export class PubSub implements PubSubModel {
  publisher: RedisClientType;
  subscriber: RedisClientType;
  blockchain: Blockchain;
  transactionPool: TransactionPool;

  constructor({ blockchain, transactionPool, redisUrl }: PubSubParameters) {
    // Needs to connect before make publishes
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;

    const client: RedisClientType = createClient({ url: redisUrl });
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
    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransactions({
            chain: parsedMessage,
          });
        });
        break;

      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        break;

      default:
        return;
    }
  }

  async publish({ message, channel }: ChannelMessage) {
    await this.subscriber.unsubscribe(channel);
    await this.publisher.publish(channel, message);
    await this.subscriber.subscribe(channel, (receivedMessage: string) =>
      this.handleMessage(receivedMessage, channel)
    );
  }

  async subscribeBlockchain() {
    this.subscriber.subscribe(CHANNELS.BLOCKCHAIN, (receivedMessage: string) =>
      this.handleMessage(receivedMessage, CHANNELS.BLOCKCHAIN)
    );
  }

  async subscribeTransaction() {
    this.subscriber.subscribe(CHANNELS.TRANSACTION, (receivedMessage: string) =>
      this.handleMessage(receivedMessage, CHANNELS.TRANSACTION)
    );
  }

  async broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  async broadcastTransaction(transaction: Transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}
