import { Transaction, Wallet } from '@domain/wallet';
import { cryptoHash } from '@util/crypto-hash';

import { Block } from '../block';

import { Blockchain } from './blockchain';

describe('Blockchain', () => {
  let blockchain: Blockchain,
    newChain: Blockchain,
    originalChain: Block[],
    errorMock: jest.Mock;

  beforeEach(() => {
    blockchain = new Blockchain();
    newChain = new Blockchain();
    errorMock = jest.fn();

    originalChain = blockchain.chain;
    global.console.error = errorMock;
  });

  it('should contains a `chain` Array instance', () => {
    expect(blockchain.chain instanceof Array).toBe(true);
  });

  it('should starts with genesis block', () => {
    expect(blockchain.chain[0]).toEqual(Block.genesis());
  });

  it('should adds a new block to the chain', () => {
    const newData = 'foo bar';
    blockchain.addBlock({ data: newData });

    expect(blockchain.chain[blockchain.chain.length - 1].data).toBe(newData);
  });

  describe('isValidChain()', () => {
    describe('when the chain does not start with the genesis block', () => {
      it('should returns false', () => {
        blockchain.chain[0] = { ...blockchain.chain[0], data: 'fake-genesis' };

        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
      });
    });

    describe('when the chain starts with the genesis block and has multiple blocks', () => {
      beforeEach(() => {
        blockchain.addBlock({ data: 'Bears' });
        blockchain.addBlock({ data: 'Beets' });
        blockchain.addBlock({ data: 'Battlestar Galactica' });
      });

      describe('and the lastHash reference has changed', () => {
        it('should returns false', () => {
          blockchain.chain[2].lastHash = 'broken-lastHash';

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain contains a block with an invalid field', () => {
        it('should returns false', () => {
          blockchain.chain[2].data = 'some-bad-and-evil-data';

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain contains a block with a jumped difficulty', () => {
        it('should returns false', () => {
          const lastBlock = blockchain.chain[blockchain.chain.length - 1];
          const lastHash = lastBlock.hash;
          const timestamp = Date.now();
          const nounce = 0;
          const data = '';
          const difficulty = lastBlock.difficulty - 3;

          const hash = cryptoHash(
            timestamp,
            lastHash,
            difficulty,
            nounce,
            data
          );

          const badBlock = new Block({
            timestamp,
            lastHash,
            hash,
            nounce,
            difficulty,
            data,
          });

          blockchain.chain.push(badBlock);

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain does not caintain any invalid blocks', () => {
        it('should returns true', () => {
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
        });
      });
    });
  });

  describe('replaceChain()', () => {
    let logMock: jest.Mock;

    beforeEach(() => {
      logMock = jest.fn();

      global.console.log = logMock;
    });

    describe('when the new chain is not longer', () => {
      beforeEach(() => {
        newChain.chain[0] = { ...newChain.chain[0], data: 'new chain' };

        blockchain.replaceChain(newChain.chain);
      });

      it('should does not replace the chain', () => {
        expect(blockchain.chain).toEqual(originalChain);
      });

      it('should logs an error', () => {
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('when the new chain is longer', () => {
      beforeEach(() => {
        newChain.addBlock({ data: 'Bears' });
        newChain.addBlock({ data: 'Beets' });
        newChain.addBlock({ data: 'Battlestar Galactica' });
      });

      describe('when the chain is invalid', () => {
        beforeEach(() => {
          newChain.chain[2].hash = 'some-fake-hash';

          blockchain.replaceChain(newChain.chain);
        });

        it('should does not replace the chain', () => {
          expect(blockchain.chain).toEqual(originalChain);
        });

        it('should logs an error', () => {
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('when the chain is valid', () => {
        beforeEach(() => {
          blockchain.replaceChain(newChain.chain);
        });

        it('should replaces the chain', () => {
          expect(blockchain.chain).toEqual(newChain.chain);
        });
        it('should logs about the chain replacement', () => {
          expect(logMock).toHaveBeenCalled();
        });
      });

      describe('and the `validateTransactions` flag is true', () => {
        it('should calls validTransactionData', () => {
          const validTransactionDataMock = jest.fn();

          blockchain.validTransactionData = validTransactionDataMock;

          newChain.addBlock({ data: 'foo' });
          blockchain.replaceChain(newChain.chain, true);

          expect(validTransactionDataMock).toHaveBeenCalled();
        });
      });
    });
  });

  describe('validTransactionData()', () => {
    let transaction: Transaction;
    let rewardTransaction: Transaction;
    let wallet: Wallet;

    beforeEach(() => {
      wallet = new Wallet();
      transaction = wallet.createTransaction({
        recipient: 'foo-address',
        amount: 65,
      });
      rewardTransaction = Transaction.rewardTransaction({
        minerWallet: wallet,
      });
    });

    describe('and the transaction data is valid', () => {
      it('should returns true', () => {
        newChain.addBlock({ data: [transaction, rewardTransaction] });

        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          true
        );
        expect(errorMock).not.toHaveBeenCalled();
      });
    });

    describe('and the transaction data has multiple rewards', () => {
      it('should returns false and logs an error', () => {
        newChain.addBlock({
          data: [transaction, rewardTransaction, rewardTransaction],
        });

        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          false
        );
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and the transaction data has at least one malformed outputMap', () => {
      describe('and the transaction is not a reward transaction', () => {
        it('should returns false and logs an error', () => {
          transaction.outputMap[wallet.publicKey] = 999999;

          newChain.addBlock({ data: [transaction, rewardTransaction] });

          expect(
            blockchain.validTransactionData({ chain: newChain.chain })
          ).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the transaction is a reward transaction', () => {
        it('should returns false and logs an error', () => {
          rewardTransaction.outputMap[wallet.publicKey] = 999999;

          newChain.addBlock({ data: [transaction, rewardTransaction] });

          expect(
            blockchain.validTransactionData({ chain: newChain.chain })
          ).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });

    describe('and the transaction data has at least one malformed input', () => {
      it('should returns false and logs an error', () => {
        wallet.balance = 9000;

        const evilOutputMap = {
          [wallet.publicKey]: 8900,
          fooRecipient: 100,
        };

        const input = {
          timestamp: Date.now(),
          amount: wallet.balance,
          address: wallet.publicKey,
          signature: wallet.sign(evilOutputMap),
        };

        const evilTransaction: Transaction = {
          id: '1',
          input,
          outputMap: evilOutputMap,
          createInput: () => input,
          createOutputMap: () => ({ '1': 1 }),
          update: () => null,
        };

        newChain.addBlock({ data: [evilTransaction, rewardTransaction] });

        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          false
        );
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and a block contains multiple identical transactions', () => {
      it('should returns false and logs an error', () => {
        newChain.addBlock({
          data: [transaction, transaction, transaction, rewardTransaction],
        });

        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          false
        );
        expect(errorMock).toHaveBeenCalled();
      });
    });
  });
});
