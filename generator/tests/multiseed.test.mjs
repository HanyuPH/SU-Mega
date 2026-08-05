import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  parseArguments,
  validateBatteryAuthorization,
  verifyOfficialArtifact,
} from "../multiseed.mjs";
import { readJson } from "../lib/io.mjs";

const generatorRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.dirname(generatorRoot);
const manifest = await readJson(path.join(generatorRoot, "multiseed", "official-artifact-manifest.json"));
const seedsDocument = await readJson(path.join(generatorRoot, "multiseed", "seeds.json"));

test("protocolo preserva 30 sementes únicas sem incluir a semente de referência", () => {
  assert.equal(seedsDocument.seeds.length, 30);
  assert.equal(new Set(seedsDocument.seeds).size, 30);
  assert.ok(!seedsDocument.seeds.includes(seedsDocument.referenceSeed));
  assert.equal(seedsDocument.status, "planned-not-authorized-for-execution");
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
  const gitState = { commit: "abc", branch: "test", status: "" };
  assert.throws(
    () => validateBatteryAuthorization({ expectedCommit: "abc" }, gitState),
    /authorization-id/,
  );
  assert.throws(
    () => validateBatteryAuthorization({ expectedCommit: "abc", authorizationId: "EC-SUM-TESTE" }, gitState),
    /permanece bloqueada/,
  );
});

test("autorização exige commit exato e árvore limpa", () => {
  const args = {
    expectedCommit: "abc",
    authorizationId: "AUT-001",
    confirmBattery: "AUTORIZACAO-EXPLICITA-CONFIRMADA",
  };
  assert.throws(() => validateBatteryAuthorization(args, { commit: "def", branch: "test", status: "" }), /Commit divergente/);
  assert.throws(() => validateBatteryAuthorization(args, { commit: "abc", branch: "test", status: " M arquivo" }), /árvore de trabalho limpa/);
  assert.doesNotThrow(() => validateBatteryAuthorization(args, { commit: "abc", branch: "test", status: "" }));
});
