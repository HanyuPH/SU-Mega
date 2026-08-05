#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generatePortfolio } from "./lib/generator-core.mjs";
import { computeMetrics } from "./lib/metrics-core.mjs";
import {
  ensureDirectory,
  gamesToCsv,
  readJson,
  sha256File,
  writeJson,
  writeText,
} from "./lib/io.mjs";

const execFileAsync = promisify(execFile);
const BATTERY_CONFIRMATION = "AUTORIZACAO-EXPLICITA-CONFIRMADA";

export function parseArguments(args) {
  const parsed = { mode: "identity" };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--mode") parsed.mode = args[++index];
    else if (argument === "--out") parsed.out = args[++index];
    else if (argument === "--expected-commit") parsed.expectedCommit = args[++index];
    else if (argument === "--authorization-id") parsed.authorizationId = args[++index];
    else if (argument === "--confirm-battery") parsed.confirmBattery = args[++index];
    else if (argument === "--manifest") parsed.manifest = args[++index];
    else if (argument === "--seeds") parsed.seeds = args[++index];
    else throw new Error(`Argumento desconhecido: ${argument}`);
  }
  if (!new Set(["identity", "battery"]).has(parsed.mode)) {
    throw new Error(`Modo inválido: ${parsed.mode}. Use identity ou battery.`);
  }
  return parsed;
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function gitCommand(repositoryRoot, args) {
  try {
    const { stdout } = await execFileAsync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" });
    return stdout.trim();
  } catch (error) {
    const detail = error?.stderr?.trim() || error?.message || String(error);
    throw new Error(`Não foi possível consultar o Git para congelar o artefato: ${detail}`);
  }
}

export async function readGitState(repositoryRoot) {
  return {
    commit: await gitCommand(repositoryRoot, ["rev-parse", "HEAD"]),
    branch: await gitCommand(repositoryRoot, ["rev-parse", "--abbrev-ref", "HEAD"]),
    status: await gitCommand(repositoryRoot, ["status", "--porcelain"]),
  };
}

export function validateBatteryAuthorization(args, gitState) {
  if (!args.expectedCommit) {
    throw new Error("A bateria exige --expected-commit para congelar o commit executado.");
  }
  if (gitState.commit !== args.expectedCommit) {
    throw new Error(`Commit divergente: esperado ${args.expectedCommit}, encontrado ${gitState.commit}.`);
  }
  if (gitState.status !== "") {
    throw new Error("A bateria exige árvore de trabalho limpa; existem alterações locais não versionadas.");
  }
  if (!args.authorizationId?.trim()) {
    throw new Error("A bateria exige --authorization-id vinculado à autorização explícita do usuário.");
  }
  if (args.confirmBattery !== BATTERY_CONFIRMATION) {
    throw new Error(`A bateria permanece bloqueada. Use --confirm-battery ${BATTERY_CONFIRMATION} somente após nova autorização explícita.`);
  }
}

export async function verifyOfficialArtifact(repositoryRoot, manifest) {
  const results = [];
  for (const [relativePath, expectedSha256] of Object.entries(manifest.files)) {
    const absolutePath = path.join(repositoryRoot, relativePath);
    const actualSha256 = await sha256File(absolutePath);
    results.push({ relativePath, expectedSha256, actualSha256, matches: actualSha256 === expectedSha256 });
  }
  const failures = results.filter((entry) => !entry.matches);
  if (failures.length > 0) {
    const detail = failures.map((entry) => `${entry.relativePath}: esperado ${entry.expectedSha256}, encontrado ${entry.actualSha256}`).join("; ");
    throw new Error(`Identidade do artefato oficial rejeitada: ${detail}`);
  }
  return results;
}

function metricSnapshot(metrics) {
  const phaseC = metrics.execution.phaseTransitions.find((transition) => transition.phase === "C");
  return {
    games: metrics.games,
    uniqueGames: metrics.uniqueGames,
    candidatesEvaluated: metrics.execution.candidatesEvaluated,
    phaseAccepted: metrics.execution.phaseAccepted,
    pairClosureGame: phaseC?.acceptedGames ?? null,
    pairsCovered: metrics.pairs.covered,
    distinctTriples: metrics.triples.distinct,
    distinctQuadruples: metrics.quadruples.distinct,
    repeatedQuadruples: metrics.quadruples.repeatedOccurrences,
    maximumIntersection: metrics.maximumIntersection,
    frequencyMinimum: metrics.frequencies.minimum,
    frequencyMaximum: metrics.frequencies.maximum,
    frequencyStandardDeviation: metrics.frequencies.standardDeviation,
  };
}

function compareExpectedMetrics(actual, expected) {
  const mismatches = [];
  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[field];
    const equal = typeof expectedValue === "object"
      ? JSON.stringify(actualValue) === JSON.stringify(expectedValue)
      : actualValue === expectedValue;
    if (!equal) mismatches.push({ field, expected: expectedValue, actual: actualValue });
  }
  return mismatches;
}

export async function runIdentity({ repositoryRoot, generatorRoot, manifest, outputDirectory, gitState = null }) {
  const verifiedFiles = await verifyOfficialArtifact(repositoryRoot, manifest);
  const config = await readJson(path.join(repositoryRoot, manifest.configuration.path));
  const identityConfig = structuredClone(config);
  identityConfig.seed = String(manifest.reference.seed);

  const generated = generatePortfolio(identityConfig);
  const csv = gamesToCsv(generated.games);
  const portfolioSha256 = sha256Text(csv);
  const metrics = computeMetrics(generated.games, identityConfig);
  metrics.execution = generated.audit;
  const snapshot = metricSnapshot(metrics);
  const metricMismatches = compareExpectedMetrics(snapshot, manifest.reference.metrics);

  const report = {
    protocol: manifest.protocol,
    mode: "identity",
    generatedAt: new Date().toISOString(),
    git: gitState,
    officialGeneratorCommit: manifest.officialGeneratorCommit,
    protocolBaseCommit: manifest.protocolBaseCommit,
    verifiedFiles,
    configuration: {
      path: manifest.configuration.path,
      sha256: manifest.configuration.sha256,
      seed: identityConfig.seed,
    },
    expectedPortfolioSha256: manifest.reference.portfolioSha256,
    actualPortfolioSha256: portfolioSha256,
    portfolioMatches: portfolioSha256 === manifest.reference.portfolioSha256,
    expectedMetrics: manifest.reference.metrics,
    actualMetrics: snapshot,
    metricMismatches,
    approved: portfolioSha256 === manifest.reference.portfolioSha256 && metricMismatches.length === 0,
  };

  if (outputDirectory) {
    await ensureDirectory(outputDirectory);
    await writeJson(path.join(outputDirectory, "identity-report.json"), report);
    await writeText(path.join(outputDirectory, "identity-games.csv"), csv);
  }

  if (!report.approved) {
    throw new Error(`Teste de identidade rejeitado. Hash compatível=${report.portfolioMatches}; divergências métricas=${metricMismatches.length}.`);
  }
  return report;
}

async function runOneSeed({ seed, baseConfig, outputDirectory }) {
  const config = structuredClone(baseConfig);
  config.seed = String(seed);
  const generated = generatePortfolio(config);
  const csv = gamesToCsv(generated.games);
  const metrics = computeMetrics(generated.games, config);
  metrics.execution = generated.audit;
  const seedDirectory = path.join(outputDirectory, `seed-${seed}`);
  await ensureDirectory(seedDirectory);
  await writeJson(path.join(seedDirectory, "config.json"), config);
  await writeText(path.join(seedDirectory, "games.csv"), csv);
  await writeJson(path.join(seedDirectory, "metrics.json"), metrics);
  const portfolioSha256 = sha256Text(csv);
  await writeText(path.join(seedDirectory, "hashes.txt"), `SHA256_GAMES=${portfolioSha256}\n`);
  return {
    seed: String(seed),
    portfolioSha256,
    metrics: metricSnapshot(metrics),
  };
}

export async function runBattery({ repositoryRoot, generatorRoot, manifest, seedsDocument, outputDirectory, args, gitState }) {
  validateBatteryAuthorization(args, gitState);
  const identityDirectory = path.join(outputDirectory, "identity");
  const identity = await runIdentity({ repositoryRoot, generatorRoot, manifest, outputDirectory: identityDirectory, gitState });
  if (!identity.approved) throw new Error("Bateria cancelada porque o teste de identidade não foi aprovado.");

  const baseConfig = await readJson(path.join(repositoryRoot, manifest.configuration.path));
  const seeds = seedsDocument.seeds.map(String);
  if (seeds.length === 0 || new Set(seeds).size !== seeds.length) {
    throw new Error("Lista de sementes vazia ou com duplicidades.");
  }

  const results = [];
  for (const seed of seeds) {
    process.stdout.write(`Executando semente ${seed} (${results.length + 1}/${seeds.length})...\n`);
    results.push(await runOneSeed({ seed, baseConfig, outputDirectory }));
  }

  const summary = {
    protocol: manifest.protocol,
    mode: "battery",
    authorization: {
      id: args.authorizationId,
      confirmation: args.confirmBattery,
    },
    generatedAt: new Date().toISOString(),
    git: gitState,
    environment: {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      architecture: process.arch,
      operatingSystemRelease: os.release(),
      cpuModel: os.cpus()[0]?.model ?? null,
    },
    identity,
    seedsSource: seedsDocument,
    results,
  };
  await writeJson(path.join(outputDirectory, "multiseed-summary.json"), summary);
  return summary;
}

export async function main(argv = process.argv.slice(2)) {
  const currentFile = fileURLToPath(import.meta.url);
  const generatorRoot = path.dirname(currentFile);
  const repositoryRoot = path.dirname(generatorRoot);
  const args = parseArguments(argv);
  const manifestPath = path.resolve(args.manifest ?? path.join(generatorRoot, "multiseed", "official-artifact-manifest.json"));
  const seedsPath = path.resolve(args.seeds ?? path.join(generatorRoot, "multiseed", "seeds.json"));
  const outputDirectory = path.resolve(args.out ?? path.join(generatorRoot, "runs", "multiseed-pending"));
  const manifest = await readJson(manifestPath);
  const gitState = args.expectedCommit || args.mode === "battery" ? await readGitState(repositoryRoot) : null;

  if (args.expectedCommit && gitState.commit !== args.expectedCommit) {
    throw new Error(`Commit divergente: esperado ${args.expectedCommit}, encontrado ${gitState.commit}.`);
  }

  if (args.mode === "identity") {
    const report = await runIdentity({ repositoryRoot, generatorRoot, manifest, outputDirectory, gitState });
    process.stdout.write(`Teste de identidade aprovado. Carteira SHA-256: ${report.actualPortfolioSha256}\n`);
    return report;
  }

  const seedsDocument = await readJson(seedsPath);
  const summary = await runBattery({ repositoryRoot, generatorRoot, manifest, seedsDocument, outputDirectory, args, gitState });
  process.stdout.write(`Bateria concluída: ${summary.results.length} sementes.\n`);
  return summary;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message ?? error}\n`);
    process.exitCode = 1;
  });
}
