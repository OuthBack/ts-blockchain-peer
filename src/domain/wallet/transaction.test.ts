import { MINING_REWARD, REWARD_INPUT } from '@configs';
import { Signature, verifySignature } from '@util/elliptic';

import { Transaction } from './transaction';
import { Wallet } from './wallet';

describe('Transaction', () => {
  let transaction: Transaction;
  let senderWallet: Wallet;
  let recipient: string;
  let amount: number;

  beforeEach(() => {
    senderWallet = new Wallet();
    recipient = 'recipient-public-key';
    amount = 50;

    transaction = new Transaction({ senderWallet, recipient, amount });
  });

  it('should has an `id`', () => {
    expect(transaction).toHaveProperty('id');
  });

  describe('outputMap', () => {
    it('should has an `outputMap', () => {
      expect(transaction).toHaveProperty('outputMap');
    });

    it('should outputs the amount to the recipient', () => {
      expect(transaction.outputMap[recipient]).toEqual(amount);
    });

    it('should outputs the remaining balance for the `sender Wallet`', () => {
      expect(transaction.outputMap[senderWallet.publicKey]).toEqual(
        senderWallet.balance - amount
      );
    });
  });

  describe('input', () => {
    it('should has an `input`', () => {
      expect(transaction).toHaveProperty('input');
    });

    it('should has a `timestamp`', () => {
      expect(transaction.input).toHaveProperty('timestamp');
    });

    it('should sets the `amount` to the `senderWallet` balance', () => {
      expect(transaction.input.amount).toEqual(senderWallet.balance);
    });

    it('should sets the `address` to the `senderWallet`', () => {
      expect(transaction.input.address).toEqual(senderWallet.publicKey);
    });

    it('should signs the input', () => {
      expect(
        verifySignature({
          publicKey: senderWallet.publicKey,
          data: transaction.outputMap,
          signature: transaction.input.signature,
        })
      ).toBe(true);
    });

    describe('validTransaction', () => {
      const errorMock = jest.fn();

      global.console.error = errorMock;

      describe('when the transaction is valid', () => {
        it('returns true', () => {
          expect(Transaction.validTransaction(transaction)).toBe(true);
        });
      });

      describe('when the transaction is invalid', () => {
        describe('and a transaction outputMap value is invalid', () => {
          it('should returns false and logs an error', () => {
            transaction.outputMap[senderWallet.publicKey] = 999999;

            expect(Transaction.validTransaction(transaction)).toBe(false);
            expect(errorMock).toHaveBeenCalled();
          });
        });

        describe('and the transaction input signature is invalid', () => {
          it('should returns false and logs an error', () => {
            transaction.input.signature = new Wallet().sign('data');

            expect(Transaction.validTransaction(transaction)).toBe(false);
            expect(errorMock).toHaveBeenCalled();
          });
        });

        describe('update()', () => {
          let originalSignature: Signature;
          let originalSenderOutput: number;
          let nextRecipient: string;
          let nextAmount: number;

          beforeEach(() => {
            originalSignature = transaction.input.signature;
            originalSenderOutput =
              transaction.outputMap[senderWallet.publicKey];
            nextRecipient = 'next-recipient';
            nextAmount = 50;

            transaction.update({
              senderWallet,
              recipient: nextRecipient,
              amount: nextAmount,
            });
          });

          describe('and the amount is invalid', () => {
            it('should throws an error', () => {
              expect(() =>
                transaction.update({
                  senderWallet,
                  recipient: 'foo',
                  amount: 999999,
                })
              ).toThrow('Amount exceeds balance');
            });
          });

          describe('and the amount is valid', () => {
            it('should outputs the amount to the next recipient', () => {
              expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });

            it('should subtracts the amount from the original sender output amount', () => {
              expect(transaction.outputMap[senderWallet.publicKey]).toEqual(
                originalSenderOutput - nextAmount
              );
            });

            it('should maintains a total output that matches the input amount', () => {
              expect(
                Object.values(transaction.outputMap).reduce(
                  (total, outputAmount) => total + outputAmount
                )
              ).toEqual(transaction.input.amount);
            });

            it('should re-signs the transaction', () => {
              expect(transaction.input.signature).not.toEqual(
                originalSignature
              );
            });

            describe('and another update for the same recipient', () => {
              let addedAmount;

              beforeEach(() => {
                addedAmount = 80;
                transaction.update({
                  senderWallet,
                  recipient: nextRecipient,
                  amount: addedAmount,
                });
              });

              it('should adds to the recipient amount', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(
                  nextAmount + addedAmount
                );
              });

              it('should subtracts the amount from the original output amount', () => {
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(
                  originalSenderOutput - nextAmount - addedAmount
                );
              });
            });
          });
        });
      });
    });
  });

  describe('rewardTransaction()', () => {
    let rewardTransaction: Transaction;
    let minerWallet: Wallet;

    beforeEach(() => {
      minerWallet = new Wallet();
      rewardTransaction = Transaction.rewardTransaction({ minerWallet });
    });

    it('should creates a transaction with the reward input', () => {
      expect(rewardTransaction.input).toEqual(REWARD_INPUT);
    });

    it('should creates ones transaction for the miner with the `MINING_REWARD`', () => {
      expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(
        MINING_REWARD
      );
    });
  });
});
