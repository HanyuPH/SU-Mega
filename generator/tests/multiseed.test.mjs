import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  parseArguments,
  validateApprovedSeedsDocument,
  validateBatteryAuthorization,
  validateBatteryOutputDirectory,
  verifyApprovedSeeds,
  verifyOfficialArtifact,
} from "../multiseed.mjs";
import { readJson } from "../lib/io.mjs";

const generatorRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.dirname(generatorRoot);
const manifest = await readJson(path.join(generatorRoot, "multiseed", "official-artifact-manifest.json"));
const seedsPath = path.join(generatorRoot, "multiseed", "seeds.json");
const seedsDocument = await readJson(seedsPath);

function validBatteryArgs() {
  return {
    expectedCommit: "abc",
    authorizationId: "AUT-001",
    confirmBattery: "AUTORIZACAO-EXPLICITA-CONFIRMADA",
  };
}

test("protocolo preserva 30 sementes únicas sem incluir a semente de referência", () => {
  assert.equal(seedsDocument.seeds.length, 30);
  assert.equal(new Set(seedsDocument.seeds).size, 30);
  assert.ok(!seedsDocument.seeds.includes(seedsDocument.referenceSeed));
  assert.equal(seedsDocument.status, "planned-not-authorized-for-execution");
});

test("hash e conteúdo da lista de sementes correspondem exatamente à lista aprovada", async () => {
  const verification = await verifyApprovedSeeds({
    repositoryRoot,
    seedsPath,
    seedsDocument,
    manifest,
  });
  assert.equal(verification.sha256, manifest.seedList.sha256);
  assert.equal(verification.count, 30);
  assert.equal(verification.exactApprovedList, true);
});

test("lista de sementes com hash alterado cancela a execução", () => {
  assert.throws(
    () => validateApprovedSeedsDocument({
      seedsDocument,
      policy: manifest.seedList,
      actualSha256: "0".repeat(64),
      actualRelativePath: manifest.seedList.path,
    }),
    /Hash da lista de sementes divergente/,
  );
});

test("lista de sementes com conteúdo alterado cancela a execução", () => {
  const altered = structuredClone(seedsDocument);
  altered.seeds[29] = "202608049999";
  assert.throws(
    () => validateApprovedSeedsDocument({
      seedsDocument: altered,
      policy: manifest.seedList,
      actualSha256: manifest.seedList.sha256,
      actualRelativePath: manifest.seedList.path,
    }),
    /não corresponde exatamente à lista aprovada/,
  );
});

test("manifesto confirma os hashes individuais do artefato oficial", async () => {
  const results = await verifyOfficialArtifact(repositoryRoot, manifest);
  assert.equal(results.length, Object.keys(manifest.files).length);
  assert.ok(results.every((entry) => entry.matches));
});

test("modo padrão executa apenas identidade", () => {
  assert.deepEqual(parseArguments([]), { mode: "identity" });
  assert.equal(parseArguments(["--mode", "identity"]).mode, "identity");
});

test("bateria permanece bloqueada sem autorização explícita", () => {
  const gitState = { commit: "abc", branch: "main", status: "" };
  assert.throws(
    () => validateBatteryAuthorization({ expectedCommit: "abc" }, gitState),
    /authorization-id/,
  );
  assert.throws(
    () => validateBatteryAuthorization({ expectedCommit: "abc", authorizationId: "EC-SUM-TESTE" }, gitState),
    /permanece bloqueada/,
  );
});

test("autorização exige commit exato, árvore limpa e branch main", () => {
  const args = validBatteryArgs();
  assert.throws(
    () => validateBatteryAuthorization(args, { commit: "def", branch: "main", status: "" }),
    /Commit divergente/,
  );
  assert.throws(
    () => validateBatteryAuthorization(args, { commit: "abc", branch: "main", status: " M arquivo" }),
    /árvore de trabalho limpa/,
  );
  assert.throws(
    () => validateBatteryAuthorization(args, { commit: "abc", branch: "feature/teste", status: "" }),
    /Branch divergente: esperada main/,
  );
  assert.doesNotThrow(
    () => validateBatteryAuthorization(args, { commit: "abc", branch: "main", status: "" }),
  );
});

test("diretório de saída não vazio cancela a bateria", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "su-mega-multiseed-output-"));
  try {
    await assert.doesNotReject(() => validateBatteryOutputDirectory({
      repositoryRoot,
      generatorRoot,
      outputDirectory: tempDirectory,
      manifest,
    }));
    await writeFile(path.join(tempDirectory, "bateria-anterior.json"), "{}\n", "utf8");
    await assert.rejects(
      () => validateBatteryOutputDirectory({
        repositoryRoot,
        generatorRoot,
        outputDirectory: tempDirectory,
        manifest,
      }),
      /Diretório de saída não está vazio/,
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("diretório oficial de referência nunca pode receber a bateria", async () => {
  const officialDirectory = path.join(repositoryRoot, manifest.officialResultDirectories[0]);
  await assert.rejects(
    () => validateBatteryOutputDirectory({
      repositoryRoot,
      generatorRoot,
      outputDirectory: officialDirectory,
      manifest,
    }),
    /conflita com área oficial ou estrutural/,
  );
});
