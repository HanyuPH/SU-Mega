import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { computeMetrics } from "../lib/metrics-core.mjs";
import { readGamesCsv, readJson, sha256File } from "../lib/io.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const run = path.join(root, "runs", "seed-202608031101");
const config = await readJson(path.join(run, "config.json"));
const games = await readGamesCsv(path.join(run, "games.csv"));
const metrics = computeMetrics(games, config);

test("execução preservada cumpre a validação mínima", () => {
  assert.equal(metrics.games, 705);
  assert.equal(metrics.uniqueGames, 705);
  assert.equal(metrics.duplicatedGames, 0);
  assert.equal(metrics.invalidGameSizes, 0);
  assert.equal(metrics.invalidNumbers, 0);
  assert.equal(metrics.repeatedNumbersInsideGames, 0);
  assert.equal(metrics.pairs.covered, 1770);
  assert.equal(metrics.quadruples.repeatedOccurrences, 0);
  assert.ok(metrics.maximumIntersection <= 3);
  assert.ok(metrics.frequencies.maximum - metrics.frequencies.minimum <= config.validation.maximumFrequencySpread);
});

test("hash da carteira preservada é estável", async () => {
  const hashesText = await import("node:fs/promises").then(({ readFile }) => readFile(path.join(run, "hashes.txt"), "utf8"));
  const expected = hashesText.match(/^SHA256_GAMES=(.+)$/m)?.[1];
  assert.equal(await sha256File(path.join(run, "games.csv")), expected);
});
