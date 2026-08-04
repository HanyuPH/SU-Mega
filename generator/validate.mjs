#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { computeMetrics } from "./lib/metrics-core.mjs";
import { readGamesCsv, readJson } from "./lib/io.mjs";

function parseArguments(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--games") parsed.games = args[++index];
    else if (argument === "--config") parsed.config = args[++index];
    else throw new Error(`Argumento desconhecido: ${argument}`);
  }
  return parsed;
}

const args = parseArguments(process.argv.slice(2));
if (!args.games || !args.config) throw new Error("Use --games <arquivo.csv> --config <config.json>.");
const config = await readJson(path.resolve(args.config));
const games = await readGamesCsv(path.resolve(args.games));
const metrics = computeMetrics(games, config);
const checks = {
  targetGames: metrics.games === config.targetGames,
  uniqueGames: metrics.duplicatedGames === 0,
  sixNumbersPerGame: metrics.invalidGameSizes === 0,
  numbersInUniverse: metrics.invalidNumbers === 0,
  noRepeatedNumbersInsideGame: metrics.repeatedNumbersInsideGames === 0,
  allPairsCovered: metrics.pairs.covered === metrics.pairs.totalPossible,
  noRepeatedQuadruples: metrics.quadruples.repeatedOccurrences === 0,
  maximumIntersection: metrics.maximumIntersection <= config.validation.maximumIntersection,
  frequencySpread: metrics.frequencies.maximum - metrics.frequencies.minimum <= config.validation.maximumFrequencySpread,
};
for (const [name, passed] of Object.entries(checks)) {
  process.stdout.write(`${passed ? "PASS" : "FAIL"} ${name}\n`);
}
if (Object.values(checks).some((passed) => !passed)) process.exitCode = 1;
