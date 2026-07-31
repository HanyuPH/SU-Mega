import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function assert(condition, message) { if (!condition) throw new Error(message); }

const manifest = JSON.parse(fs.readFileSync(path.join(root,"manifest.json"),"utf8"));
assert(manifest.name === "SU Mega – C2", "Nome do manifesto incorreto.");
assert(manifest.display === "standalone", "PWA deve usar display standalone.");
assert(manifest.start_url === "./" && manifest.scope === "./", "Escopo/start_url incorretos.");
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 1, "Ícone PWA ausente.");
for (const icon of manifest.icons) assert(fs.existsSync(path.join(root,icon.src)), `Ícone ausente: ${icon.src}`);

const listeners = {};
let installedAssets = [];
const deletedCaches = [];
const cachedResponse = {source:"cache"};
const cache = {addAll: async assets => { installedAssets = assets; }, put: async()=>{}};
const context = {
  self: {
    addEventListener: (name,handler) => { listeners[name]=handler; },
    skipWaiting: () => {},
    clients: {claim: () => {}}
  },
  caches: {
    open: async () => cache,
    keys: async () => ["su-mega-c1-old","su-mega-c2-v1","unrelated"],
    delete: async key => { deletedCaches.push(key); return true; },
    match: async request => request === "./index.html" ? cachedResponse : (request?.url?.includes("styles.css") ? cachedResponse : null)
  },
  fetch: async () => { throw new Error("offline"); },
  Promise,
  console
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,"service-worker.js"),"utf8"),context);
assert(listeners.install && listeners.activate && listeners.fetch, "Eventos obrigatórios do service worker ausentes.");

let pending;
listeners.install({waitUntil: promise => { pending=promise; }});
await pending;
assert(installedAssets.length >= 16, "Lista de cache inicial incompleta.");
for (const asset of installedAssets) {
  const clean = asset === "./" ? "index.html" : asset.replace(/^\.\//,"");
  assert(fs.existsSync(path.join(root,clean)), `Ativo cacheado ausente: ${asset}`);
}

listeners.activate({waitUntil: promise => { pending=promise; }});
await pending;
assert(deletedCaches.includes("su-mega-c1-old") && !deletedCaches.includes("su-mega-c2-v1"), "Limpeza de caches antigos falhou.");

let responsePromise;
listeners.fetch({request:{method:"GET",mode:"navigate",url:"https://example.test/"},respondWith:p=>{responsePromise=p;}});
const offlineNavigation = await responsePromise;
assert(offlineNavigation === cachedResponse, "Fallback offline de navegação falhou.");

const html = fs.readFileSync(path.join(root,"index.html"),"utf8");
for (const id of ["count-total","count-pendente","count-registrado","count-apostado","count-visible","filter-status","filter-system","filter-group","filter-game","filter-numbers","clear-filters","export-backup","import-file","reset-status","print-games"]) {
  assert(html.includes(`id="${id}"`), `Elemento obrigatório ausente: ${id}`);
}
assert(html.indexOf('data/games-01.js') < html.indexOf('data/games-10.js') && html.indexOf('data/games-10.js') < html.indexOf('core.js') && html.indexOf('core.js') < html.indexOf('app.js'), "Ordem dos scripts incorreta.");

const css = fs.readFileSync(path.join(root,"styles.css"),"utf8");
assert(css.includes("@media(max-width:620px)") && css.includes("@media(max-width:380px)"), "Regras responsivas móveis ausentes.");
assert(css.includes("@media print"), "Estilo de impressão ausente.");
assert(css.includes("grid-template-columns:repeat(6"), "Grade de seis dezenas ausente.");
assert(css.includes("overflow-x:hidden"), "Proteção contra corte lateral ausente.");

console.log(JSON.stringify({ok:true,manifest:"ok",cachedAssets:installedAssets.length,offlineFallback:"ok",requiredControls:"ok",responsiveRules:"ok"},null,2));
