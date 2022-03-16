import bodyParser from 'body-parser';
import express from 'express';
import request from 'request';

import { Blockchain } from '../blockchain/blockchain';

import { PubSub } from './pubsub';

const app = express();
const blockchain = new Blockchain();
const pubSub = new PubSub({ blockchain });
(async () => {
  await pubSub.connect();
})();

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

setTimeout(() => pubSub.broadcastChain(), 1000);

app.use(bodyParser.json());

app.get('/api/blocks', (_req, res) => {
  res.json(blockchain.chain);
});

app.post('/api/mine', async (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data });

  await pubSub.broadcastChain();

  res.redirect('/api/blocks');
});

const syncChains = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, res, body) => {
    if (!error && res.statusCode === 200) {
      const rootChain = JSON.parse(body);

      console.log('replace chain on a sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });
};

let PEER_PORT: number;

if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + 1 - 1000 + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`listening at localhost:${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    syncChains();
  }
});
