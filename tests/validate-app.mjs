import fs from "node:fs";
import vm from "node:vm";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (let part = 1; part <= 10; part += 1) {
  vm.runInThisContext(fs.readFileSync(new URL(`../data/games-${String(part).padStart(2, "0")}.js`, import.meta.url), "utf8"));
}
vm.runInThisContext(fs.readFileSync(new URL("../core.js", import.meta.url), "utf8"));

const games = globalThis.SU_MEGA_GAMES;
const core = globalThis.SUMegaCore;
const labels = { pendente: "Pendente", registrado: "Registrado", apostado: "Apostado" };
const states = core.createDefaultStates(games);

assert(core.countStatuses(games, states).pendente === 705, "Contador inicial de pendentes incorreto.");
states["ouro-001"] = "apostado";
states["diamante-001"] = "registrado";
const counts = core.countStatuses(games, states);
assert(counts.pendente === 703 && counts.registrado === 1 && counts.apostado === 1, "Contadores após mudança incorretos.");

function filterCount({status="all",system="all",group="all",game="",numbers=""}={}) {
  const gameNumber = core.parseGameFilter(game);
  const numberQuery = core.parseNumberFilter(numbers);
  return games.filter(item => core.matchesGame(item, states[item.id], {status,system,group,gameNumber,numberQuery})).length;
}

assert(filterCount() === 705, "Filtro vazio deve exibir 705 jogos.");
assert(filterCount({system:"Ouro"}) === 141, "Filtro Ouro deve exibir 141 jogos.");
assert(filterCount({group:"121–141"}) === 105, "Filtro do grupo 121–141 deve exibir 105 jogos.");
assert(filterCount({system:"Ouro",group:"121–141"}) === 21, "Combinação Ouro + 121–141 deve exibir 21 jogos.");
assert(filterCount({game:"141"}) === 5, "Número de jogo 141 deve localizar cinco jogos.");
assert(filterCount({status:"apostado"}) === 1, "Filtro Apostado deve exibir um jogo.");
assert(filterCount({status:"registrado"}) === 1, "Filtro Registrado deve exibir um jogo.");
assert(filterCount({numbers:"09 13 18"}) >= 1, "Pesquisa por dezenas conhecidas não retornou resultado.");
assert(filterCount({numbers:"61"}) === 0, "Dezena inválida não pode retornar jogos.");
assert(core.parseGameFilter("000") !== core.parseGameFilter("001"), "Validação do número do jogo falhou.");
assert(core.padNumber(1) === "01" && core.padGame(1) === "001", "Formatação numérica incorreta.");

const backup = {app:"SU Mega",wallet:"C2",statuses:{"ouro-001":"apostado","ouro-002":"registrado"}};
const imported = core.validateBackup(backup,games,labels,"SU Mega","C2");
assert(imported["ouro-001"] === "apostado" && imported["ouro-002"] === "registrado", "Importação válida falhou.");
let rejected = false;
try { core.validateBackup({app:"SU Loto",wallet:"C2",statuses:{"ouro-001":"apostado"}},games,labels,"SU Mega","C2"); } catch { rejected = true; }
assert(rejected, "Backup de outro aplicativo deveria ser rejeitado.");
rejected = false;
try { core.validateBackup({app:"SU Mega",wallet:"C2",statuses:{"ouro-001":"inválido"}},games,labels,"SU Mega","C2"); } catch { rejected = true; }
assert(rejected, "Status inválido deveria ser rejeitado.");

console.log(JSON.stringify({
  ok:true,
  counters:counts,
  filters:{all:705,ouro:141,group121_141:105,ouroGroup:21,game141:5,apostado:1,registrado:1,numbers091318:filterCount({numbers:"09 13 18"})},
  backupValidation:"ok"
},null,2));
