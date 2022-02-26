import { Block } from '@block';

import { Blockchain } from './blockchain';

describe('Blockchain', () => {
  let blockchain: Blockchain, newChain: Blockchain, originalChain: Block[];

  beforeEach(() => {
    blockchain = new Blockchain();
    newChain = new Blockchain();

    originalChain = blockchain.chain;
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

      describe('and the chain does not caintain any invalid blocks', () => {
        it('should returns true', () => {
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
        });
      });
    });
  });

  describe('replaceChain()', () => {
    let errorMock: jest.Mock, logMock: jest.Mock;

    beforeEach(() => {
      errorMock = jest.fn();
      logMock = jest.fn();

      global.console.error = errorMock;
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
    });
  });
});
