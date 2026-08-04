const UINT64_MASK = (1n << 64n) - 1n;
const FLOAT_DENOMINATOR = 9007199254740992;

export class SeededRng {
  constructor(seed) {
    const normalized = BigInt(seed);
    this.state = normalized === 0n ? 1n : normalized & UINT64_MASK;
  }

  nextUint64() {
    let x = this.state;
    x ^= x >> 12n;
    x ^= (x << 25n) & UINT64_MASK;
    x ^= x >> 27n;
    this.state = x & UINT64_MASK;
    return (this.state * 2685821657736338717n) & UINT64_MASK;
  }

  next() {
    return Number(this.nextUint64() >> 11n) / FLOAT_DENOMINATOR;
  }

  integer(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError("maxExclusive deve ser um inteiro positivo.");
    }
    return Math.floor(this.next() * maxExclusive);
  }

  pick(values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new RangeError("Não é possível selecionar um item de uma lista vazia.");
    }
    return values[this.integer(values.length)];
  }
}
