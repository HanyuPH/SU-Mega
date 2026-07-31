(() => {
  "use strict";
  const STORAGE_KEY = "su-mega-c2-contests-v1";
  const core = globalThis.SUMegaContestCore;
  let games = [];
  let states = {};
  let labels = {};
  let padGame = number => String(number).padStart(3, "0");
  let announce = () => {};
  let downloadJson = () => {};
  let contests = [];
  let selectedNumbers = new Set();
  let activeContestNumber = null;
  let initialized = false;
  const el = {};

  function init(context) {
    if (initialized) return;
    initialized = true;
    games = context.games || [];
    states = context.states || {};
    labels = context.labels || {};
    padGame = context.padGame || padGame;
    announce = context.announce || announce;
    downloadJson = context.downloadJson || downloadJson;
    cacheElements();
    buildNumberGrid();
    load();
    bind();
    renderHistory();
    updateCounts();
  }

  function cacheElements() {
    [
      "contest-form","contest-form-title","contest-editing-number","contest-number","contest-date",
      "contest-source","contest-notes","contest-numbers-text","contest-selected-count",
      "contest-number-grid","contest-form-error","contest-cancel-edit","contest-clear-form",
      "contest-scope","contest-search","contest-csv-file","contest-export-history",
      "contest-clear-history","contest-total-count","contest-tab-count","contest-history",
      "contest-empty-history","contest-analysis"
    ].forEach(id => { el[id] = document.getElementById(id); });
  }

  function bind() {
    el["contest-form"].addEventListener("submit", saveContestFromForm);
    el["contest-clear-form"].addEventListener("click", () => resetForm());
    el["contest-cancel-edit"].addEventListener("click", () => resetForm());
    el["contest-numbers-text"].addEventListener("input", syncFromText);
    el["contest-scope"].addEventListener("change", () => {
      renderHistory();
      if (activeContestNumber !== null) openContest(activeContestNumber, false);
    });
    el["contest-search"].addEventListener("input", renderHistory);
    el["contest-csv-file"].addEventListener("change", event => {
      const file = event.target.files && event.target.files[0];
      if (file) importCsv(file);
      event.target.value = "";
    });
    el["contest-export-history"].addEventListener("click", () => {
      downloadJson({
        app: "SU Mega",
        wallet: "C2",
        type: "contest-history",
        version: 1,
        exportedAt: new Date().toISOString(),
        contests
      }, `SU-Mega-C2-concursos-${new Date().toISOString().slice(0, 10)}.json`);
      announce("Histórico de concursos exportado");
    });
    el["contest-clear-history"].addEventListener("click", () => {
      if (!contests.length) return;
      if (!confirm("Apagar todos os concursos salvos neste aparelho? Esta ação não altera os 705 jogos.")) return;
      contests = [];
      activeContestNumber = null;
      save();
      resetForm();
      renderHistory();
      renderAnalysis(null);
      announce("Histórico local apagado");
    });
  }

  function buildNumberGrid() {
    const fragment = document.createDocumentFragment();
    for (let number = 1; number <= 60; number += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "draw-ball";
      button.dataset.number = String(number);
      button.textContent = String(number).padStart(2, "0");
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => toggleNumber(number));
      fragment.appendChild(button);
    }
    el["contest-number-grid"].replaceChildren(fragment);
  }

  function toggleNumber(number) {
    if (selectedNumbers.has(number)) selectedNumbers.delete(number);
    else if (selectedNumbers.size < 6) selectedNumbers.add(number);
    else return showError("Selecione exatamente 6 dezenas.");
    syncSelectionUi();
    hideError();
  }

  function syncFromText() {
    const values = core.parseNumbers(el["contest-numbers-text"].value);
    selectedNumbers = new Set(values.slice(0, 6));
    syncSelectionUi(false);
    if (values.length > 6) showError("Foram encontradas mais de 6 dezenas; somente as seis primeiras válidas foram selecionadas.");
    else hideError();
  }

  function syncSelectionUi(updateText = true) {
    const sorted = [...selectedNumbers].sort((a, b) => a - b);
    el["contest-selected-count"].textContent = `${sorted.length}/6`;
    el["contest-selected-count"].classList.toggle("complete", sorted.length === 6);
    el["contest-number-grid"].querySelectorAll(".draw-ball").forEach(button => {
      const active = selectedNumbers.has(Number(button.dataset.number));
      button.classList.toggle("selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (updateText) el["contest-numbers-text"].value = sorted.map(number => String(number).padStart(2, "0")).join(" ");
  }

  function load() {
    try {
      contests = core.sanitizeContests(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      contests = [];
    }
  }

  function save() {
    contests.sort((a, b) => b.number - a.number);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(contests)); } catch {}
    updateCounts();
  }

  function saveContestFromForm(event) {
    event.preventDefault();
    hideError();
    const number = Number(el["contest-number"].value);
    const date = el["contest-date"].value;
    const numbers = [...selectedNumbers].sort((a, b) => a - b);
    const source = el["contest-source"].value.trim();
    const notes = el["contest-notes"].value.trim();
    const editing = Number(el["contest-editing-number"].value) || null;

    if (!Number.isInteger(number) || number < 1) return showError("Informe um número de concurso válido.");
    if (!date) return showError("Informe a data do sorteio.");
    if (numbers.length !== 6) return showError("Selecione exatamente 6 dezenas diferentes.");
    if (source && !/^https?:\/\//i.test(source)) return showError("A fonte deve começar com http:// ou https://.");
    if (contests.some(item => item.number === number && item.number !== editing)) {
      return showError("Este concurso já está registrado. Abra-o no histórico para editar.");
    }

    const now = new Date().toISOString();
    const existing = contests.find(item => item.number === editing);
    const record = { number, date, numbers, source, notes, createdAt: existing?.createdAt || now, updatedAt: now };
    contests = existing ? contests.map(item => item.number === editing ? record : item) : [record, ...contests];
    activeContestNumber = number;
    save();
    renderHistory();
    resetForm(false);
    openContest(number);
    announce(existing ? "Concurso atualizado e conferido" : "Concurso registrado e conferido");
  }

  function showError(message) {
    el["contest-form-error"].textContent = message;
    el["contest-form-error"].hidden = false;
  }

  function hideError() {
    el["contest-form-error"].hidden = true;
    el["contest-form-error"].textContent = "";
  }

  function resetForm(clearActive = true) {
    el["contest-form"].reset();
    el["contest-editing-number"].value = "";
    selectedNumbers = new Set();
    syncSelectionUi();
    hideError();
    el["contest-form-title"].textContent = "Cadastrar concurso";
    el["contest-cancel-edit"].hidden = true;
    if (clearActive) activeContestNumber = null;
  }

  function editContest(number) {
    const contest = contests.find(item => item.number === number);
    if (!contest) return;
    el["contest-editing-number"].value = String(contest.number);
    el["contest-number"].value = String(contest.number);
    el["contest-date"].value = contest.date;
    el["contest-source"].value = contest.source;
    el["contest-notes"].value = contest.notes;
    selectedNumbers = new Set(contest.numbers);
    syncSelectionUi();
    el["contest-form-title"].textContent = `Editar concurso ${contest.number}`;
    el["contest-cancel-edit"].hidden = false;
    document.querySelector(".contest-form-card").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteContest(number) {
    if (!confirm(`Excluir o concurso ${number} do histórico local?`)) return;
    contests = contests.filter(item => item.number !== number);
    if (activeContestNumber === number) {
      activeContestNumber = null;
      renderAnalysis(null);
    }
    save();
    renderHistory();
    announce("Concurso excluído");
  }

  function updateCounts() {
    const count = contests.length;
    el["contest-total-count"].textContent = String(count);
    el["contest-tab-count"].textContent = String(count);
  }

  function formatContestDate(value) {
    if (!value) return "Data não informada";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  function gameLabel(game) {
    return `${game.system} • Jogo ${padGame(game.number)}`;
  }

  function renderHistory() {
    const query = String(el["contest-search"].value || "").trim();
    const filtered = contests.filter(item => !query || String(item.number).includes(query));
    el["contest-empty-history"].hidden = filtered.length !== 0;
    const fragment = document.createDocumentFragment();

    for (const contest of filtered) {
      const article = document.createElement("article");
      article.className = "history-item";
      if (contest.number === activeContestNumber) article.classList.add("active");
      const result = core.calculate(contest, games, states, el["contest-scope"].value);
      const open = document.createElement("button");
      open.type = "button";
      open.className = "history-open";
      open.setAttribute("aria-label", `Abrir concurso ${contest.number}`);
      open.innerHTML = `<span class="history-title">Concurso ${contest.number}</span>
        <span class="history-date">${escapeHtml(formatContestDate(contest.date))}</span>
        <span class="history-balls">${contest.numbers.map(number => `<b>${String(number).padStart(2, "0")}</b>`).join("")}</span>
        <span class="history-result">Melhor: <strong>${result.best}</strong> acertos • ${result.evaluated} jogos conferidos</span>`;
      open.addEventListener("click", () => openContest(contest.number));

      const actions = document.createElement("div");
      actions.className = "history-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Editar";
      edit.addEventListener("click", () => editContest(contest.number));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger-text";
      remove.textContent = "Excluir";
      remove.addEventListener("click", () => deleteContest(contest.number));
      actions.append(edit, remove);
      article.append(open, actions);
      fragment.appendChild(article);
    }
    el["contest-history"].replaceChildren(fragment);
  }

  function openContest(number, scroll = true) {
    const contest = contests.find(item => item.number === Number(number));
    if (!contest) return false;
    activeContestNumber = contest.number;
    renderHistory();
    renderAnalysis(contest);
    if (scroll) el["contest-analysis"].scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function renderAnalysis(contest) {
    if (!contest) {
      el["contest-analysis"].hidden = true;
      el["contest-analysis"].replaceChildren();
      return;
    }
    const scope = el["contest-scope"].value;
    const result = core.calculate(contest, games, states, scope);
    const scopeLabel = el["contest-scope"].selectedOptions[0].textContent;
    const source = contest.source
      ? `<a href="${escapeAttribute(contest.source)}" target="_blank" rel="noopener">Abrir fonte</a>`
      : "Sem link de fonte";
    const topGames = result.bestGames.slice(0, 20)
      .map(item => `<span class="top-game-chip">${escapeHtml(gameLabel(item.game))} • ${item.hits} acertos</span>`).join("");
    const systemRows = result.systems.map(system =>
      `<tr><td>${escapeHtml(system.name)}</td><td>${system.evaluated}</td><td><strong>${system.best}</strong></td>
      <td>${system.distribution[4]}</td><td>${system.distribution[5]}</td><td>${system.distribution[6]}</td></tr>`
    ).join("");
    const gameRows = result.results.map(item => {
      const status = labels[states[item.game.id]] || states[item.game.id] || "Pendente";
      return `<article class="checked-game ${item.hits >= 4 ? "prize" : ""}">
        <div class="checked-game-head"><div><strong>${escapeHtml(gameLabel(item.game))}</strong>
        <span>${escapeHtml(item.game.group)} • ${escapeHtml(status)}</span></div>
        <b class="score-badge score-${item.hits}">${item.hits} acertos</b></div>
        <div class="checked-numbers">${item.game.numbers.map(number =>
          `<span class="${contest.numbers.includes(number) ? "hit" : "miss"}">${String(number).padStart(2, "0")}</span>`
        ).join("")}</div></article>`;
    }).join("");

    el["contest-analysis"].hidden = false;
    el["contest-analysis"].innerHTML = `
      <div class="analysis-head"><div><p class="eyebrow green">Conferência automática</p>
      <h2>Concurso ${contest.number}</h2>
      <p>${escapeHtml(formatContestDate(contest.date))} • ${escapeHtml(scopeLabel)} • ${source}</p></div>
      <button type="button" class="button" id="analysis-edit">Editar concurso</button></div>
      <div class="draw-result-balls">${contest.numbers.map(number => `<span>${String(number).padStart(2, "0")}</span>`).join("")}</div>
      <div class="analysis-metrics">
        <article><span>Jogos conferidos</span><strong>${result.evaluated}</strong></article>
        <article><span>Melhor acerto</span><strong>${result.best}</strong></article>
        <article><span>Quadras</span><strong>${result.distribution[4]}</strong></article>
        <article><span>Quinas</span><strong>${result.distribution[5]}</strong></article>
        <article><span>Senas</span><strong>${result.distribution[6]}</strong></article>
      </div>
      <div class="analysis-section"><h3>Melhores jogos</h3><div class="top-games">${topGames || "Nenhum jogo no escopo selecionado."}</div></div>
      <div class="analysis-section"><h3>Comparação entre os blocos</h3>
        <div class="table-scroll"><table class="analysis-table"><thead><tr>
          <th>Bloco</th><th>Conferidos</th><th>Melhor</th><th>Quadra</th><th>Quina</th><th>Sena</th>
        </tr></thead><tbody>${systemRows}</tbody></table></div>
      </div>
      <details class="analysis-section"><summary><strong>Ver todos os ${result.evaluated} jogos conferidos</strong></summary>
        <div class="checked-games">${gameRows}</div>
      </details>`;
    document.getElementById("analysis-edit").addEventListener("click", () => editContest(contest.number));
  }

  function importCsv(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = core.parseCsv(String(reader.result));
        if (!incoming.length) throw new Error("Nenhum concurso válido foi encontrado.");
        const map = new Map(contests.map(item => [item.number, item]));
        for (const item of incoming) {
          const existing = map.get(item.number);
          map.set(item.number, {
            ...item,
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        contests = core.sanitizeContests([...map.values()]);
        save();
        renderHistory();
        announce(`${incoming.length} concursos importados por CSV`);
      } catch (error) {
        alert(`Não foi possível importar o CSV. ${error.message || ""}`.trim());
      }
    };
    reader.onerror = () => alert("Não foi possível ler o arquivo CSV.");
    reader.readAsText(file);
  }

  function importData(input, replace = false) {
    const incoming = core.sanitizeContests(input);
    if (!incoming.length && Array.isArray(input) && input.length) return false;
    if (replace) contests = incoming;
    else {
      const map = new Map(contests.map(item => [item.number, item]));
      incoming.forEach(item => map.set(item.number, item));
      contests = core.sanitizeContests([...map.values()]);
    }
    save();
    renderHistory();
    if (activeContestNumber !== null && !contests.some(item => item.number === activeContestNumber)) {
      activeContestNumber = null;
      renderAnalysis(null);
    }
    return true;
  }

  function refresh() {
    renderHistory();
    if (activeContestNumber !== null) openContest(activeContestNumber, false);
  }

  function switchToContests() {
    const tab = document.querySelector('[data-view="contests-view"]');
    if (tab && !tab.classList.contains("active")) tab.click();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function escapeAttribute(value) { return escapeHtml(value); }

  globalThis.SUMegaContests = {
    init,
    refresh,
    openContest(number) { switchToContests(); return openContest(number); },
    exportData() { return structuredClone(contests); },
    importData
  };
})();
