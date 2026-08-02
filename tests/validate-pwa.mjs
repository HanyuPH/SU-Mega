import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function assert(condition, message) { if (!condition) throw new Error(message); }

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
assert(manifest.name === "SU Mega – C2", "Nome do manifesto incorreto.");
assert(manifest.display === "standalone", "PWA deve usar display standalone.");
assert(manifest.start_url === "./" && manifest.scope === "./", "Escopo/start_url incorretos.");
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 1, "Ícone PWA ausente.");
for (const icon of manifest.icons) assert(fs.existsSync(path.join(root, icon.src)), `Ícone ausente: ${icon.src}`);

const serviceWorkerSource = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const cacheMatch = serviceWorkerSource.match(/const\s+CACHE_NAME\s*=\s*["']([^"']+)["']/);
assert(cacheMatch, "Nome do cache atual não foi identificado.");
const currentCacheName = cacheMatch[1];

const listeners = {};
let installedAssets = [];
const deletedCaches = [];
const cachedResponse = { source: "cache" };
const cache = { addAll: async assets => { installedAssets = assets; }, put: async () => {} };
const context = {
  self: {
    location: { origin: "https://example.test" },
    addEventListener: (name, handler) => { listeners[name] = handler; },
    skipWaiting: () => {},
    clients: { claim: () => {} }
  },
  caches: {
    open: async () => cache,
    keys: async () => ["su-mega-c1-old", "su-mega-c2-v1", currentCacheName, "unrelated"],
    delete: async key => { deletedCaches.push(key); return true; },
    match: async request => {
      if (request === "./index.html") return cachedResponse;
      const url = typeof request === "string" ? request : request?.url || "";
      return url.includes("styles.css") || url.includes("ultimo-concurso.json") ? cachedResponse : null;
    }
  },
  fetch: async () => { throw new Error("offline"); },
  URL,
  Promise,
  console
};
vm.createContext(context);
vm.runInContext(serviceWorkerSource, context);
assert(listeners.install && listeners.activate && listeners.fetch, "Eventos obrigatórios do service worker ausentes.");

let pending;
listeners.install({ waitUntil: promise => { pending = promise; } });
await pending;
assert(installedAssets.length >= 22, "Lista de cache inicial incompleta.");
for (const asset of installedAssets) {
  const clean = asset === "./" ? "index.html" : asset.replace(/^\.\//, "").split("?")[0];
  assert(fs.existsSync(path.join(root, clean)), `Ativo cacheado ausente: ${asset}`);
}
for (const required of [
  "./contests.css", "./contest-core.js", "./contests.js", "./official-results.js",
  "./data/ultimo-concurso.json", "./data/concursos-oficiais.json"
]) assert(installedAssets.includes(required), `Novo ativo não foi incluído no cache: ${required}`);

listeners.activate({ waitUntil: promise => { pending = promise; } });
await pending;
assert(deletedCaches.includes("su-mega-c1-old"), "Cache C1 antigo não foi removido.");
assert(deletedCaches.includes("su-mega-c2-v1"), "Cache C2 v1 antigo não foi removido.");
assert(!deletedCaches.includes(currentCacheName), "Cache atual foi removido incorretamente.");
assert(!deletedCaches.includes("unrelated"), "Cache de outro aplicativo não deve ser removido.");

let responsePromise;
listeners.fetch({
  request: { method: "GET", mode: "navigate", url: "https://example.test/SU-Mega/" },
  respondWith: promise => { responsePromise = promise; }
});
const offlineNavigation = await responsePromise;
assert(offlineNavigation === cachedResponse, "Fallback offline de navegação falhou.");

listeners.fetch({
  request: { method: "GET", mode: "cors", url: "https://example.test/SU-Mega/data/ultimo-concurso.json" },
  respondWith: promise => { responsePromise = promise; }
});
const offlineResult = await responsePromise;
assert(offlineResult === cachedResponse, "Fallback offline do último concurso falhou.");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const id of [
  "count-total", "count-pendente", "count-registrado", "count-apostado", "count-visible",
  "filter-status", "filter-system", "filter-group", "filter-game", "filter-numbers",
  "clear-filters", "export-backup", "import-file", "reset-status", "print-games",
  "contests-view", "contest-form", "contest-scope", "contest-analysis"
]) assert(html.includes(`id="${id}"`), `Elemento obrigatório ausente: ${id}`);
assert(
  html.indexOf("data/games-01.js") < html.indexOf("data/games-10.js") &&
  html.indexOf("data/games-10.js") < html.indexOf("core.js") &&
  html.indexOf("core.js") < html.indexOf("contest-core.js") &&
  html.indexOf("contest-core.js") < html.indexOf("contests.js") &&
  html.indexOf("contests.js") < html.indexOf("app.js") &&
  html.indexOf("app.js") < html.indexOf("official-results.js"),
  "Ordem dos scripts incorreta."
);

const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const contestsCss = fs.readFileSync(path.join(root, "contests.css"), "utf8");
assert(css.includes("@media(max-width:620px)") && css.includes("@media(max-width:380px)"), "Regras responsivas móveis ausentes.");
assert(css.includes("@media print") && contestsCss.includes("@media print"), "Estilo de impressão ausente.");
assert(css.includes("grid-template-columns:repeat(6"), "Grade de seis dezenas dos jogos ausente.");
assert(contestsCss.includes("contest-number-grid") && contestsCss.includes("repeat(10"), "Grade de seleção 01–60 ausente.");
assert(css.includes("overflow-x:hidden"), "Proteção contra corte lateral ausente.");

console.log(JSON.stringify({
  ok: true,
  manifest: "ok",
  cacheName: currentCacheName,
  cachedAssets: installedAssets.length,
  offlineNavigation: "ok",
  offlineOfficialResult: "ok",
  requiredControls: "ok",
  responsiveRules: "ok"
}, null, 2));
