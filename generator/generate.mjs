#!/usr/bin/env node
import { cp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { generatePortfolio } from "./lib/generator-core.mjs";
import { computeMetrics } from "./lib/metrics-core.mjs";
import { ensureDirectory, gamesToCsv, readJson, sha256Directory, sha256File, writeJson, writeText } from "./lib/io.mjs";

function parseArguments(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--config") parsed.config = args[++index];
    else if (argument === "--out") parsed.out = args[++index];
    else throw new Error(`Argumento desconhecido: ${argument}`);
  }
  return parsed;
}

const currentFile = fileURLToPath(import.meta.url);
const generatorRoot = path.dirname(currentFile);
const args = parseArguments(process.argv.slice(2));
const configPath = path.resolve(args.config ?? path.join(generatorRoot, "config.example.json"));
const config = await readJson(configPath);
const runDirectory = path.resolve(args.out ?? path.join(generatorRoot, "runs", `seed-${config.seed}`));
await ensureDirectory(runDirectory);

const logLines = [];
let lastReportedMissingPairs = Number.POSITIVE_INFINITY;
function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  logLines.push(line);
  process.stdout.write(`${line}\n`);
}

log("Início do Gerador Funcional Reconstruído da SU Mega.");
log(`Semente controlada: ${config.seed}.`);
log(`Meta: ${config.targetGames} jogos de ${config.numbersPerGame} dezenas no universo 01-${config.universeSize}.`);

const generated = generatePortfolio(config, {
  onAccepted(event) {
    const pairClosureJustOccurred = event.missingPairs === 0 && lastReportedMissingPairs > 0;
    if (event.acceptedGames % config.logging.progressEveryGames === 0 || pairClosureJustOccurred) {
      log(`Fase ${event.phase}: ${event.acceptedGames}/${config.targetGames} jogos; pares ausentes=${event.missingPairs}; frequência=${event.frequencyMinimum}-${event.frequencyMaximum}.`);
    }
    lastReportedMissingPairs = event.missingPairs;
  },
});

const metrics = computeMetrics(generated.games, config);
metrics.execution = generated.audit;
metrics.generatorIdentity = "Gerador Funcional Reconstruído da SU Mega";
metrics.methodologyStatus = {
  confirmedFacts: [
    "A carteira oficial vigente permanece SU Mega – C2.",
    "A planilha SU Mega - C2.xlsx permanece a fonte oficial dos 705 jogos vigentes.",
    "A restrição de quadras únicas implica interseção máxima de três dezenas entre jogos distintos.",
  ],
  reconstructedFunctionalRules: [
    "Construção em três fases funcionais A, B e C.",
    "Prioridade para pares e trincas novas com equilíbrio de frequências e multiplicidade dos pares.",
    "Rejeição absoluta de jogos duplicados e de quadras já utilizadas.",
  ],
  experimentalParameters: [
    "Pesos da função de pontuação.",
    "Tamanhos dos lotes de candidatas.",
    "Probabilidades de forçar pares ausentes.",
    "Quantidade de jogos do núcleo da Fase A.",
  ],
  historicalWeightClaim: false,
};

const gamesPath = path.join(runDirectory, "games.csv");
const metricsPath = path.join(runDirectory, "metrics.json");
const copiedConfigPath = path.join(runDirectory, "config.json");
const environmentPath = path.join(runDirectory, "environment.json");
const logPath = path.join(runDirectory, "execution.log");
const hashesPath = path.join(runDirectory, "hashes.txt");

await writeText(gamesPath, gamesToCsv(generated.games));
await cp(configPath, copiedConfigPath, { force: true });
await writeJson(metricsPath, metrics);
await writeJson(environmentPath, {
  generatedAt: new Date().toISOString(),
  node: process.version,
  v8: process.versions.v8,
  platform: process.platform,
  architecture: process.arch,
  operatingSystemRelease: os.release(),
  cpuModel: os.cpus()[0]?.model ?? null,
});

const codeHash = await sha256Directory(generatorRoot, (relativePath) => {
  return !relativePath.startsWith("runs/") && [".mjs", ".json", ".md"].some((extension) => relativePath.endsWith(extension));
});
const hashes = {
  code: codeHash.hash,
  configuration: await sha256File(copiedConfigPath),
  generatedPortfolio: await sha256File(gamesPath),
};
await writeText(hashesPath, [
  `SHA256_CODE=${hashes.code}`,
  `SHA256_CONFIG=${hashes.configuration}`,
  `SHA256_GAMES=${hashes.generatedPortfolio}`,
  "",
  "Arquivos incluídos no hash agregado do código:",
  ...codeHash.files,
  "",
].join("\n"));

log(`Concluído em ${generated.audit.durationSeconds.toFixed(3)} segundos.`);
log(`Jogos únicos: ${metrics.uniqueGames}; pares cobertos: ${metrics.pairs.covered}/${metrics.pairs.totalPossible}; quadras repetidas: ${metrics.quadruples.repeatedOccurrences}.`);
log(`Hashes: código=${hashes.code}; configuração=${hashes.configuration}; carteira=${hashes.generatedPortfolio}.`);
await writeText(logPath, `${logLines.join("\n")}\n`);

if (
  metrics.games !== config.targetGames
  || metrics.duplicatedGames !== 0
  || metrics.invalidGameSizes !== 0
  || metrics.invalidNumbers !== 0
  || metrics.repeatedNumbersInsideGames !== 0
  || metrics.pairs.covered !== metrics.pairs.totalPossible
  || metrics.quadruples.repeatedOccurrences !== 0
  || metrics.maximumIntersection > config.validation.maximumIntersection
  || metrics.frequencies.maximum - metrics.frequencies.minimum > config.validation.maximumFrequencySpread
) {
  throw new Error("A execução foi preservada, mas não cumpriu todos os critérios mínimos de validação.");
}
