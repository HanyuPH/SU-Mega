#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { computeMetrics } from "./lib/metrics-core.mjs";
import { readGamesCsv, writeJson } from "./lib/io.mjs";

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, list) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), list[index + 1]]);
  return pairs;
}, []));
if (!args.games) throw new Error("Use --games <arquivo.csv>.");
const games = await readGamesCsv(path.resolve(args.games));
const metrics = computeMetrics(games);
if (args.output) await writeJson(path.resolve(args.output), metrics);
process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
