import fs from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";

for (let part = 1; part <= 10; part += 1) {
  vm.runInThisContext(fs.readFileSync(new URL(`../data/games-${String(part).padStart(2, "0")}.js`, import.meta.url), "utf8"));
}

const games = globalThis.SU_MEGA_GAMES;
const expectedSystems = ["Ouro", "Diamante", "Platina", "Safira", "Ônix"];
const expectedHash = "518af4d8fc79783d4eecc4ab7c233424c51640a7372bf1d25437ebf3fa5af370";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(Array.isArray(games), "Dados não carregados.");
assert(games.length === 705, `Total incorreto: ${games.length}`);

const ids = new Set();
const combinations = new Set();
for (const system of expectedSystems) {
  const subset = games.filter(game => game.system === system);
  assert(subset.length === 141, `${system} possui ${subset.length} jogos.`);
  assert(subset.every((game, index) => game.number === index + 1), `${system} está fora da ordem 001–141.`);
}
for (const game of games) {
  assert(!ids.has(game.id), `ID duplicado: ${game.id}`);
  ids.add(game.id);
  assert(Array.isArray(game.numbers) && game.numbers.length === 6, `Jogo inválido: ${game.id}`);
  assert(game.numbers.every(number => Number.isInteger(number) && number >= 1 && number <= 60), `Dezena fora do intervalo: ${game.id}`);
  assert(new Set(game.numbers).size === 6, `Dezena repetida no jogo: ${game.id}`);
  assert(game.numbers.every((number, index, values) => index === 0 || values[index - 1] < number), `Ordem das dezenas inválida: ${game.id}`);
  const key = game.numbers.join("-");
  assert(!combinations.has(key), `Jogo duplicado: ${key}`);
  combinations.add(key);
}
const hash = crypto.createHash("sha256").update(JSON.stringify(games)).digest("hex");
assert(hash === expectedHash, `Hash dos dados divergente: ${hash}`);
console.log(JSON.stringify({ok:true,totalGames:games.length,systems:Object.fromEntries(expectedSystems.map(system=>[system,games.filter(game=>game.system===system).length])),duplicateIds:0,duplicateGames:0,dataSha256:hash},null,2));
