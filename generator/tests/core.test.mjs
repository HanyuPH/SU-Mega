import assert from "node:assert/strict";
import test from "node:test";
import { chooseCount, forEachCombination, gameKey } from "../lib/combinations.mjs";
import { SeededRng } from "../lib/rng.mjs";

test("combinações de seis dezenas têm 15 pares, 20 trincas e 15 quadras", () => {
  const game = [1, 2, 3, 4, 5, 6];
  for (const [size, expected] of [[2, 15], [3, 20], [4, 15]]) {
    let count = 0;
    forEachCombination(game, size, () => { count += 1; });
    assert.equal(count, expected);
    assert.equal(chooseCount(6, size), expected);
  }
});

test("semente controlada reproduz a mesma sequência", () => {
  const left = new SeededRng("202608031101");
  const right = new SeededRng("202608031101");
  assert.deepEqual(Array.from({ length: 20 }, () => left.integer(60)), Array.from({ length: 20 }, () => right.integer(60)));
});

test("chave do jogo é ordenável e preserva zero à esquerda", () => {
  assert.equal(gameKey([1, 9, 10, 22, 41, 60]), "01-09-10-22-41-60");
});
