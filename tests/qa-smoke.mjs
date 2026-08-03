import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const APP = process.env.QA_APP || "mega";
const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:4173/";
const EXPECTED_VERSION = process.env.QA_VERSION || (APP === "mega" ? "v27" : "v20");

const config = APP === "mega" ? {
  name: "SU Mega",
  gameCount: 705,
  versionDataset: "suMegaBetaBuild",
  walletStorage: "su-mega-c2-status-v1",
  contestStorage: "su-mega-c2-contests-v1",
  betsStorage: "su-mega-c2-contest-bets-v1",
  lockStorage: "su-mega-c2-contest-locks-v1",
  betsRoot: "#su-contest-bets",
  betNumber: "#su-bet-contest",
  betHistory: "#su-bet-history",
  firstSystem: "Ouro",
  searchInput: "#filter-game",
  clearFilters: "#clear-filters",
  contestNumbers: [1, 2, 3, 4, 5, 6],
  selectedCount: "6/6",
  fixtureContest: 999800,
  fixtureTiers: [
    { descricaoFaixa: "6 acertos", numeroDeGanhadores: 1, valorPremio: 1000000 },
    { descricaoFaixa: "5 acertos", numeroDeGanhadores: 20, valorPremio: 10000 },
    { descricaoFaixa: "4 acertos", numeroDeGanhadores: 1000, valorPremio: 500 }
  ]
} : {
  name: "SU Loto",
  gameCount: 300,
  versionDataset: "suLotoBetaBuild",
  walletStorage: "su-loto-c2-status-v4",
  contestStorage: "su-loto-c2-contests-v1",
  betsStorage: "su-loto-c2-contest-bets-v1",
  lockStorage: "su-loto-c2-contest-locks-v1",
  betsRoot: "#su-loto-contest-bets",
  betNumber: "#su-loto-bet-contest",
  betHistory: "#su-loto-bet-history",
  firstSystem: "Base preservada",
  searchInput: "#search",
  clearFilters: null,
  contestNumbers: Array.from({ length: 15 }, (_, index) => index + 1),
  selectedCount: "15/15",
  fixtureContest: 999800,
  fixtureTiers: [
    { descricaoFaixa: "15 acertos", numeroDeGanhadores: 1, valorPremio: 1000000 },
    { descricaoFaixa: "14 acertos", numeroDeGanhadores: 20, valorPremio: 10000 },
    { descricaoFaixa: "13 acertos", numeroDeGanhadores: 1000, valorPremio: 50 },
    { descricaoFaixa: "12 acertos", numeroDeGanhadores: 10000, valorPremio: 12 },
    { descricaoFaixa: "11 acertos", numeroDeGanhadores: 100000, valorPremio: 6 }
  ]
};

const results = [];
const pageErrors = [];
const consoleErrors = [];
const startedAt = new Date().toISOString();
let browser;
let context;
let page;
let baselineWalletPayload;
let firstId;
let secondId;
let initialFirstStatus;
let initialSecondStatus;

function record(name, status, details = "") {
  results.push({ name, status, details });
  const icon = status === "pass" ? "✓" : status === "skip" ? "○" : "✗";
  console.log(`${icon} ${name}${details ? ` — ${details}` : ""}`);
}

async function test(name, fn) {
  try {
    await fn();
    record(name, "pass");
  } catch (error) {
    record(name, "fail", error?.stack || String(error));
  }
}

async function waitText(selector, expected, timeout = 10000) {
  await page.waitForFunction(({ selector, expected }) => {
    const node = document.querySelector(selector);
    return node && String(node.textContent || "").includes(expected);
  }, { selector, expected }, { timeout });
}

async function boot({ requireModules = true } = {}) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".game-card", { timeout: 20000 });
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    await navigator.serviceWorker.ready;
    await new Promise(resolve => setTimeout(resolve, 350));
    return true;
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".game-card", { timeout: 20000 });
  if (!requireModules) return;
  await page.waitForSelector("#su-beta-banner", { timeout: 30000 });
  await page.waitForFunction(({ key, version }) => document.documentElement.dataset[key] === version,
    { key: config.versionDataset, version: EXPECTED_VERSION }, { timeout: 30000 });
  await page.waitForSelector(config.betsRoot, { timeout: 30000 });
  await page.waitForSelector(".official-sync-card", { timeout: 30000 });
}

async function switchView(view) {
  await page.click(`.view-tab[data-view="${view}"]`);
  await page.waitForFunction(viewId => {
    const panel = document.getElementById(viewId);
    return panel && !panel.hidden;
  }, view);
}

async function resetFilters() {
  if (config.clearFilters) {
    await page.click(config.clearFilters);
    return;
  }
  await page.selectOption("#filter-status", "all");
  await page.selectOption("#filter-system", "all");
  await page.selectOption("#filter-group", "all");
  await page.fill("#search", "");
}

async function markGame(cardId, status) {
  await page.locator(`.game-card[data-id="${cardId}"] button[data-status="${status}"]`).click();
  await page.waitForFunction(({ cardId, status }) =>
    document.querySelector(`.game-card[data-id="${cardId}"]`)?.dataset.status === status,
    { cardId, status });
}

async function currentCounts() {
  return page.evaluate(() => ({
    pendente: Number(document.querySelector("#count-pendente")?.textContent || 0),
    registrado: Number(document.querySelector("#count-registrado")?.textContent || 0),
    apostado: Number(document.querySelector("#count-apostado")?.textContent || 0)
  }));
}

async function restoreBaseline() {
  if (!baselineWalletPayload) return;
  await context.setOffline(false).catch(() => {});
  await page.evaluate(({ key, payload, contestKey, betsKey, lockKey }) => {
    const value = JSON.stringify(payload);
    localStorage.setItem(key, value);
    localStorage.removeItem(contestKey);
    localStorage.removeItem(betsKey);
    localStorage.removeItem(lockKey);
    try { window.dispatchEvent(new StorageEvent("storage", { key, newValue: value })); } catch {}
  }, {
    key: config.walletStorage,
    payload: baselineWalletPayload,
    contestKey: config.contestStorage,
    betsKey: config.betsStorage,
    lockKey: config.lockStorage
  });
}

async function reportAndExit() {
  const failed = results.filter(item => item.status === "fail");
  const passed = results.filter(item => item.status === "pass");
  const report = {
    app: config.name,
    expectedVersion: EXPECTED_VERSION,
    startedAt,
    finishedAt: new Date().toISOString(),
    totals: { passed: passed.length, failed: failed.length, total: results.length },
    results,
    pageErrors,
    consoleErrors
  };
  await fs.mkdir("qa", { recursive: true });
  await fs.writeFile("qa/latest-report.json", JSON.stringify(report, null, 2));
  const lines = [
    `# Auditoria automática — ${config.name} ${EXPECTED_VERSION}`,
    "",
    `- Executada em: ${report.finishedAt}`,
    `- Aprovados: ${passed.length}`,
    `- Falhas: ${failed.length}`,
    `- Total: ${results.length}`,
    "",
    "## Resultados",
    "",
    ...results.map(item => `- ${item.status === "pass" ? "✅" : item.status === "skip" ? "⚪" : "❌"} **${item.name}**${item.details ? ` — ${item.details.replace(/\n/g, " ").slice(0, 900)}` : ""}`),
    "",
    "## Erros JavaScript não tratados",
    "",
    ...(pageErrors.length ? pageErrors.map(item => `- ${item}`) : ["- Nenhum erro JavaScript não tratado capturado."]),
    "",
    "## Mensagens de erro do console",
    "",
    ...(consoleErrors.length ? consoleErrors.map(item => `- ${item}`) : ["- Nenhuma mensagem de erro do console capturada."]),
    ""
  ];
  await fs.writeFile("qa/latest-report.md", lines.join("\n"));
  if (browser) await browser.close();
  if (failed.length) process.exitCode = 1;
}

try {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    acceptDownloads: true,
    serviceWorkers: "allow"
  });
  page = await context.newPage();

  await page.route("https://servicebus2.caixa.gov.br/**", async route => {
    const url = new URL(route.request().url());
    const requested = Number(url.pathname.split("/").filter(Boolean).at(-1));
    const contest = Number.isInteger(requested) && requested > 0 ? requested : config.fixtureContest;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        numero: contest,
        dataApuracao: "03/08/2026",
        listaDezenas: config.contestNumbers.map(number => String(number).padStart(2, "0")),
        listaRateioPremio: config.fixtureTiers,
        acumulado: false,
        numeroConcursoProximo: contest + 1,
        dataProximoConcurso: "31/12/2099",
        valorEstimadoProximoConcurso: 1000000,
        nomeMunicipioUFSorteio: "Fonte simulada da auditoria"
      })
    });
  });

  page.on("pageerror", error => pageErrors.push(String(error)));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("dialog", dialog => dialog.accept().catch(() => {}));

  await test("Inicialização, service worker e módulos Beta", async () => {
    await boot();
    assert.equal(await page.locator(".game-card").count(), config.gameCount);
    assert.equal(await page.textContent("#count-total"), String(config.gameCount));
    assert.equal(await page.locator(".view-tab").count(), 2);
    assert.equal(await page.locator(config.betsRoot).count(), 1);
    assert.equal(await page.locator(".official-sync-card").count(), 1);
    baselineWalletPayload = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || "{}"), config.walletStorage);
  });

  await test("Integridade do DOM, IDs únicos e layout móvel", async () => {
    const audit = await page.evaluate(() => {
      const counts = {};
      document.querySelectorAll("[id]").forEach(node => { counts[node.id] = (counts[node.id] || 0) + 1; });
      return {
        duplicates: Object.entries(counts).filter(([, count]) => count > 1),
        overflow: document.documentElement.scrollWidth - window.innerWidth
      };
    });
    assert.deepEqual(audit.duplicates, []);
    assert.ok(audit.overflow <= 2, `overflow horizontal de ${audit.overflow}px`);
  });

  await test("Navegação entre Carteira e Concursos", async () => {
    await switchView("contests-view");
    assert.equal(await page.getAttribute('.view-tab[data-view="contests-view"]', "aria-selected"), "true");
    assert.equal(await page.isHidden("#wallet-view"), true);
    await switchView("wallet-view");
    assert.equal(await page.getAttribute('.view-tab[data-view="wallet-view"]', "aria-selected"), "true");
    assert.equal(await page.isHidden("#contests-view"), true);
  });

  await test("Alteração de status e contadores respeitando o estado inicial", async () => {
    const pending = page.locator('.game-card[data-status="pendente"]');
    firstId = await (await pending.count() ? pending.first() : page.locator(".game-card").first()).getAttribute("data-id");
    secondId = await (await pending.count() > 1 ? pending.nth(1) : page.locator(".game-card").nth(1)).getAttribute("data-id");
    initialFirstStatus = await page.locator(`.game-card[data-id="${firstId}"]`).getAttribute("data-status");
    initialSecondStatus = await page.locator(`.game-card[data-id="${secondId}"]`).getAttribute("data-status");
    const baseline = await currentCounts();

    await markGame(firstId, "apostado");
    let counts = await currentCounts();
    assert.equal(counts.apostado, baseline.apostado + (initialFirstStatus === "apostado" ? 0 : 1));

    await markGame(firstId, "registrado");
    counts = await currentCounts();
    assert.equal(counts.registrado, baseline.registrado + (initialFirstStatus === "registrado" ? 0 : 1));
    assert.equal(counts.apostado, baseline.apostado);

    await markGame(firstId, initialFirstStatus || "pendente");
    assert.deepEqual(await currentCounts(), baseline);
  });

  await test("Filtros de status, sistema, grupo e busca", async () => {
    await markGame(firstId, "apostado");
    await page.selectOption("#filter-status", "apostado");
    await page.waitForFunction(() => Number(document.querySelector("#visible-count")?.textContent) === Number(document.querySelector("#count-apostado")?.textContent));
    await resetFilters();

    await page.selectOption("#filter-system", config.firstSystem);
    await page.waitForFunction(total => {
      const value = Number(document.querySelector("#visible-count")?.textContent);
      return value > 0 && value < total;
    }, config.gameCount);
    await resetFilters();

    const group = await page.locator("#filter-group option").nth(1).getAttribute("value");
    await page.selectOption("#filter-group", group);
    await page.waitForFunction(total => {
      const value = Number(document.querySelector("#visible-count")?.textContent);
      return value > 0 && value < total;
    }, config.gameCount);
    await resetFilters();

    const searchValue = APP === "mega"
      ? await page.locator(`.game-card[data-id="${firstId}"]`).getAttribute("data-number")
      : String(firstId);
    await page.fill(config.searchInput, searchValue || "1");
    await page.waitForFunction(total => {
      const value = Number(document.querySelector("#visible-count")?.textContent);
      return value > 0 && value < total;
    }, config.gameCount);
    await resetFilters();
    await markGame(firstId, initialFirstStatus || "pendente");
  });

  await test("Exportação, importação e restauração de backup", async () => {
    const downloadPromise = page.waitForEvent("download");
    await page.click("#export-backup");
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /backup/i);

    const payload = structuredClone(baselineWalletPayload);
    const statuses = payload.statuses || payload;
    statuses[firstId] = "registrado";
    await page.locator("#import-file").setInputFiles({
      name: "qa-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ ...payload, statuses }))
    });
    await page.waitForFunction(id => document.querySelector(`.game-card[data-id="${id}"]`)?.dataset.status === "registrado", firstId);
    await restoreBaseline();
    await page.waitForFunction(({ id, status }) => document.querySelector(`.game-card[data-id="${id}"]`)?.dataset.status === status,
      { id: firstId, status: initialFirstStatus });
  });

  await test("Formulário, seleção de dezenas e conferência oficial manual", async () => {
    await switchView("contests-view");
    await page.fill("#contest-number", "999901");
    await page.fill("#contest-date", "2026-08-03");
    await page.fill("#contest-numbers-text", config.contestNumbers.map(number => String(number).padStart(2, "0")).join(" "));
    assert.equal(await page.textContent("#contest-selected-count"), config.selectedCount);
    await page.click('#contest-form button[type="submit"]');
    await page.waitForFunction(() => document.querySelector("#contest-total-count")?.textContent === "1");
    assert.equal(await page.isVisible("#contest-analysis"), true);
    assert.match(await page.textContent("#contest-analysis"), /Jogos conferidos/i);
    assert.equal(await page.locator("#contest-history .history-item").count(), 1);
  });

  await test("Edição, busca, escopo, exportação e CSV do histórico", async () => {
    await page.click("#contest-history .history-actions button:not(.danger-text)");
    await waitText("#contest-form-title", "Editar concurso 999901");
    await page.click("#contest-cancel-edit");
    await page.fill("#contest-search", "999901");
    assert.equal(await page.locator("#contest-history .history-item").count(), 1);
    await page.selectOption("#contest-scope", "apostado");
    await page.selectOption("#contest-scope", "all");

    const downloadPromise = page.waitForEvent("download");
    await page.click("#contest-export-history");
    assert.match((await downloadPromise).suggestedFilename(), /concursos/i);
    await page.fill("#contest-search", "");

    const csvNumbers = config.contestNumbers.map(number => String(number).padStart(2, "0")).join(";");
    await page.locator("#contest-csv-file").setInputFiles({
      name: "qa-concursos.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(`999902;03/08/2026;${csvNumbers}\n`)
    });
    await page.waitForFunction(() => document.querySelector("#contest-total-count")?.textContent === "2");
    await page.click("#contest-clear-history");
    await page.waitForFunction(() => document.querySelector("#contest-total-count")?.textContent === "0");
  });

  await test("Consulta automática à fonte oficial e registro disponível", async () => {
    await page.click("#official-refresh");
    await page.waitForFunction(() => !document.querySelector("#official-refresh")?.disabled, null, { timeout: 25000 });
    await waitText("#official-preview-title", `Concurso ${config.fixtureContest}`, 25000);
    assert.equal(await page.isVisible("#official-result-preview"), true);
    assert.equal(await page.locator("#official-preview-balls span").count(), config.contestNumbers.length);

    await page.fill("#official-contest-number", "");
    await page.click("#official-search-specific");
    await page.waitForFunction(() => {
      const node = document.querySelector("#official-search-error");
      return node && !node.hidden && node.textContent.trim().length > 0;
    });
  });

  await test("Painel de nuvem e estado de sincronização presentes", async () => {
    const cloudCandidates = APP === "mega"
      ? ["#su-cloud-status", "#su-cloud-status-text", "#su-account-panel"]
      : ["#su-loto-cloud-status", "#su-loto-cloud-text", "#su-loto-cloud-panel"];
    const present = [];
    for (const selector of cloudCandidates) present.push(await page.locator(selector).count());
    assert.ok(present.some(Boolean), `nenhum elemento de nuvem encontrado: ${cloudCandidates.join(", ")}`);
  });

  await test("Apostas por concurso: registrar, selecionar e destacar", async () => {
    await switchView("wallet-view");
    await markGame(firstId, "apostado");
    await markGame(secondId, "apostado");
    await switchView("contests-view");
    await page.fill(config.betNumber, "999911");

    const typeSelector = APP === "mega" ? "#su-bet-type" : "#su-loto-bet-type";
    const specialLabel = APP === "mega" ? "#su-bet-special-label" : "#su-loto-bet-special-label";
    await page.selectOption(typeSelector, "especial");
    assert.equal(await page.isVisible(specialLabel), true);
    await page.selectOption(typeSelector, "normal");

    await page.click("#su-save-contest-bets");
    await page.waitForSelector(`${config.betHistory} button[data-contest="999911"]`);
    await page.click(`${config.betHistory} button[data-contest="999911"]`);
    await page.waitForSelector(`${config.betHistory} button[data-contest="999911"].is-selected`);
    assert.equal(await page.locator(`${config.betHistory} button[data-contest="999911"] .contest-selected-badge`).count(), 1);
    await waitText(`${config.betsRoot} .contest-selection-context`, "Concurso 999911");
  });

  await test("Apostas por concurso: concluir, liberar e reabrir", async () => {
    await page.click("#su-close-contest-bets");
    await page.waitForTimeout(1300);
    await page.waitForSelector(".game-card", { timeout: 20000 });
    await page.waitForSelector(config.betsRoot, { timeout: 30000 });
    await switchView("contests-view");
    await page.click(`${config.betHistory} button[data-contest="999911"]`);
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || "{}")["999911"]?.status === "concluido", config.betsStorage);
    await page.waitForFunction(() => {
      const button = document.querySelector("#su-reopen-contest-bets");
      return button && !button.disabled;
    });
    await page.click("#su-reopen-contest-bets");
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || "{}")["999911"]?.status === "ativo", config.betsStorage);
    await switchView("wallet-view");
    assert.equal(await page.locator(`.game-card[data-id="${firstId}"]`).getAttribute("data-status"), "apostado");
    assert.equal(await page.locator(`.game-card[data-id="${secondId}"]`).getAttribute("data-status"), "apostado");
  });

  await test("Apostas por concurso: exclusão sem alterar status atual", async () => {
    await switchView("contests-view");
    await page.fill(config.betNumber, "999911");
    await page.click("#su-delete-contest-bets");
    await page.waitForFunction(key => !JSON.parse(localStorage.getItem(key) || "{}")["999911"], config.betsStorage);
    await switchView("wallet-view");
    assert.equal(await page.locator(`.game-card[data-id="${firstId}"]`).getAttribute("data-status"), "apostado");
  });

  await test("Persistência após recarregar", async () => {
    await markGame(firstId, "registrado");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(`.game-card[data-id="${firstId}"]`, { timeout: 20000 });
    assert.equal(await page.locator(`.game-card[data-id="${firstId}"]`).getAttribute("data-status"), "registrado");
  });

  await test("Núcleo disponível offline e dados preservados", async () => {
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".game-card", { timeout: 20000 });
    await markGame(firstId, "apostado");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(`.game-card[data-id="${firstId}"]`, { timeout: 20000 });
    assert.equal(await page.locator(`.game-card[data-id="${firstId}"]`).getAttribute("data-status"), "apostado");
    await context.setOffline(false);
  });

  await test("Manifesto, ícone, estilos e service worker disponíveis", async () => {
    const paths = APP === "mega"
      ? ["manifest.json", "assets/icons/icon.svg", "styles.css", "contests.css", "service-worker.js"]
      : ["manifest.json", "icon.svg", "styles.css", "contests.css", "service-worker.js"];
    for (const path of paths) {
      const response = await page.request.get(new URL(path, BASE_URL).toString());
      assert.ok(response.ok(), `${path}: HTTP ${response.status()}`);
    }
  });

  await test("Ausência de erros JavaScript não tratados", async () => {
    assert.deepEqual(pageErrors, []);
  });
} catch (error) {
  record("Falha geral da auditoria", "fail", error?.stack || String(error));
} finally {
  try { await restoreBaseline(); } catch {}
  await reportAndExit();
}
