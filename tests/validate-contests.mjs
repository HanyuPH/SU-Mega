import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import vm from "node:vm";
import { normalizeCaixaPayload } from "../scripts/update-megasena-result.mjs";

const context = { globalThis: {} };
context.globalThis = context;
vm.createContext(context);

for (const file of (await readdir("data")).filter(name => /^games-\d{2}\.js$/.test(name)).sort()) {
  vm.runInContext(await readFile(`data/${file}`, "utf8"), context, { filename: file });
}
vm.runInContext(await readFile("contest-core.js", "utf8"), context, { filename: "contest-core.js" });

const games = context.SU_MEGA_GAMES;
const core = context.SUMegaContestCore;
assert.equal(games.length, 705, "A carteira deve conter 705 jogos.");
assert.equal(new Set(games.map(game => game.id)).size, 705, "IDs dos jogos devem ser únicos.");

const contest = { number: 3038, date: "2026-07-30", numbers: [30, 35, 38, 39, 46, 50] };
const states = Object.fromEntries(games.map(game => [game.id, "pendente"]));
const result = core.calculate(contest, games, states, "all");
assert.equal(result.evaluated, 705);
assert.equal(result.best, 3);
assert.equal(result.bestGames.length, 8);
assert.equal(
  JSON.stringify(result.bestGames.map(item => `${item.game.system}-${String(item.game.number).padStart(3, "0")}`)),
  JSON.stringify(["Diamante-015","Diamante-039","Platina-063","Platina-103","Safira-007","Safira-138","Ônix-002","Ônix-024"])
);
assert.equal(JSON.stringify(result.distribution), JSON.stringify({ 4: 0, 5: 0, 6: 0 }));

states["ouro-001"] = "apostado";
states["ouro-002"] = "registrado";
assert.equal(core.calculate(contest, games, states, "apostado").evaluated, 1);
assert.equal(core.calculate(contest, games, states, "registrado").evaluated, 1);
assert.equal(JSON.stringify(core.parseNumbers("60 01 35 35 00 61")), JSON.stringify([1, 35, 60]));
assert.equal(core.sanitizeContests([{ number: 1, date: "31/07/2026", numbers: [1,2,3,4,5,6] }]).length, 1);
assert.equal(core.sanitizeContests([{ number: 1, date: "31/07/2026", numbers: [1,2,3,4,5] }]).length, 0);

const imported = core.parseCsv("Concurso,Data,Números\n3038,30/07/2026,30,35,38,39,46,50\n");
assert.equal(imported.length, 1);
assert.equal(JSON.stringify(imported[0].numbers), JSON.stringify([30,35,38,39,46,50]));

const normalized = normalizeCaixaPayload({
  tipoJogo: "MEGA_SENA",
  numero: 3038,
  dataApuracao: "30/07/2026",
  listaDezenas: ["30","35","38","39","46","50"],
  dezenasSorteadasOrdemSorteio: ["38","50","35","39","30","46"],
  listaRateioPremio: [
    { descricaoFaixa: "6 acertos", faixa: 1, numeroDeGanhadores: 0, valorPremio: 0 },
    { descricaoFaixa: "5 acertos", faixa: 2, numeroDeGanhadores: 41, valorPremio: 64733.96 },
    { descricaoFaixa: "4 acertos", faixa: 3, numeroDeGanhadores: 2549, valorPremio: 1716.31 }
  ],
  numeroConcursoProximo: 3039,
  dataProximoConcurso: "01/08/2026",
  valorEstimadoProximoConcurso: 100000000
}, "2026-07-31T14:00:00.000Z");
assert.equal(normalized.game, "MEGA_SENA");
assert.equal(normalized.number, 3038);
assert.deepEqual(normalized.numbers, [30,35,38,39,46,50]);
assert.deepEqual(normalized.prizeTiers.map(item => item.hits), [6,5,4]);

const index = await readFile("index.html", "utf8");
for (const required of [
  'id="contests-view"', 'id="contest-form"', 'id="contest-scope"',
  'src="contest-core.js"', 'src="contests.js"', 'src="official-results.js"'
]) assert.ok(index.includes(required), `Controle ausente no HTML: ${required}`);

const serviceWorker = await readFile("service-worker.js", "utf8");
for (const asset of [
  "./contests.css","./contest-core.js","./contests.js","./official-results.js",
  "./data/ultimo-concurso.json","./data/concursos-oficiais.json"
]) assert.ok(serviceWorker.includes(asset), `Ativo ausente no cache: ${asset}`);

console.log("Conferência, comparação, importação e fonte oficial validadas.");
