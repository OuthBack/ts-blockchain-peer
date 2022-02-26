import { cryptoHash } from './crypto-hash';

describe('Hash', () => {
  it('should generates a SHA-256 hashed output', () => {
    expect(cryptoHash('foo')).toEqual(
      '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae'
    );
  });

  it('should produces the same hash with same input arguments in any order', () => {
    expect(cryptoHash('one', 'two', 'three')).toEqual(
      cryptoHash('three', 'two', 'one')
    );
  });
});
