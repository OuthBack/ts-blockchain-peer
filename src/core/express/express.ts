import { TransactionPool } from 'domain/wallet/transaction-pool';

import { Blockchain } from '@domain/blockchain';
import { Wallet } from '@domain/wallet';
import bodyParser from 'body-parser';
import { TransactionMiner } from 'core/miner';
import cors from 'cors';
import express from 'express';
import request from 'request';

import { PubSub } from '../pubsub/pubsub';

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool });
(async () => {
  await pubsub.connect();
})();
const transactionMiner = new TransactionMiner({
  blockchain,
  transactionPool,
  wallet,
  pubsub,
});

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

setTimeout(() => {
  pubsub.broadcastChain();
  pubsub.subscribeTransaction();
}, 1000);

app.use(cors());

app.use(bodyParser.json());

app.get('/api/blocks', (_req, res) => {
  res.json(blockchain.chain);
});

app.get<{ paginatedId: number }>('/api/blocks/:paginatedId', (req, res) => {
  const { paginatedId } = req.params;
  const { length } = blockchain.chain;

  const blocksReversed = blockchain.chain.slice().reverse();

  let startIndex = (paginatedId - 1) * 5;
  let endIndex = paginatedId * 5;

  startIndex = startIndex < length ? startIndex : length;
  endIndex = endIndex < length ? endIndex : length;

  res.json(blocksReversed.slice(startIndex, endIndex));
});

app.get('/api/blocks/length', (_req, res) => {
  res.json(blockchain.chain.length);
});

app.post('/api/mine', async (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data });

  await pubsub.broadcastChain();

  res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (_, res) => {
  const address = wallet.publicKey;

  res.json({
    address,
    balance: Wallet.calculateBalance({
      chain: blockchain.chain,
      address,
    }),
  });
});

app.get<{ address: string }>('/api/wallet-info/:address', (req, res) => {
  const { address } = req.params;

  res.json({
    address,
    balance: Wallet.calculateBalance({
      chain: blockchain.chain,
      address,
    }),
  });
});

app.post('/api/transact', async (req, res) => {
  const { amount, recipient } = req.body;

  let transaction = transactionPool.existingTransaction({
    inputAddress: wallet.publicKey,
  });

  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount });
    } else {
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain,
      });
    }
  } catch (error) {
    return res.status(400).json({ type: 'error', message: error.message });
  }

  transactionPool.setTransaction(transaction);

  await pubsub.broadcastTransaction(transaction);

  return res.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (_, res) => {
  res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (_, res) => {
  transactionMiner.mineTransactions();

  res.redirect('/api/blocks');
});

const syncWithRootState = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, res, body) => {
    if (!error && res.statusCode === 200) {
      const rootChain = JSON.parse(body);

      console.log('replace chain on a sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });

  request(
    { url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootTransactionPoolMap = JSON.parse(body);

        console.log(
          'replace transaction pool map on a sync with',
          rootTransactionPoolMap
        );
        transactionPool.setMap(rootTransactionPoolMap);
      }
    }
  );
};

let PEER_PORT: number;

if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + 1 - 1000 + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`listening at localhost:${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    syncWithRootState();
  }
});
