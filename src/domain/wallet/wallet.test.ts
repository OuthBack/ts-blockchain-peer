import { verifySignature } from '@util/elliptic';

import { Wallet } from './wallet';

import { Transaction } from '.';

describe('Wallet', () => {
  let wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  it('should has as `balance`', () => {
    expect(wallet).toHaveProperty('balance');
  });

  it('should has a `public key`', () => {
    expect(wallet).toHaveProperty('publicKey');
  });

  describe('signing data', () => {
    const data = 'foo';

    it('should verifies a signature', () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data,
          signature: wallet.sign(data),
        })
      ).toBe(true);
    });

    it('should does not verify an invalid signature', () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data,
          signature: new Wallet().sign(data),
        })
      ).toBe(false);
    });
  });

  describe('createTransaction()', () => {
    describe('and the amount exceeds the balance', () => {
      it('should throws and error', () => {
        expect(() =>
          wallet.createTransaction({
            amount: 999999,
            recipient: 'foo-recipient',
          })
        ).toThrow('Amount exceeds balance');
      });
    });

    describe('and the amount is valid', () => {
      let transaction: Transaction;
      let amount: number;
      let recipient: string;

      beforeEach(() => {
        amount = 50;
        recipient = 'foo-recipient';
        transaction = wallet.createTransaction({ amount, recipient });
      });

      it('should creates an instance of `Transaction`', () => {
        expect(transaction instanceof Transaction).toBe(true);
      });

      it('should matches the transactuins input with the wallet', () => {
        expect(transaction.input.address).toEqual(wallet.publicKey);
      });

      it('should outputs the amount of the recipient', () => {
        expect(transaction.outputMap[recipient]).toEqual(amount);
      });
    });
  });
});
