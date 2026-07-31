(() => {
  "use strict";

  const APP_NAME = "SU Mega";
  const WALLET = "C2";
  const STORAGE_KEY = "su-mega-c2-status-v1";
  const SYSTEM_ORDER = ["Ouro", "Diamante", "Platina", "Safira", "Ônix"];
  const STATUS_LABELS = {
    pendente: "Pendente",
    registrado: "Registrado",
    apostado: "Apostado"
  };
  const games = Array.isArray(globalThis.SU_MEGA_GAMES) ? globalThis.SU_MEGA_GAMES : [];
  const core = globalThis.SUMegaCore;
  const gameIds = new Set(games.map(game => game.id));
  const states = Object.create(null);
  const cardById = new Map();
  const sectionBySystem = new Map();

  const elements = {
    systems: document.getElementById("systems"),
    systemTemplate: document.getElementById("system-template"),
    gameTemplate: document.getElementById("game-template"),
    saveStatus: document.getElementById("save-status"),
    visibleCount: document.getElementById("visible-count"),
    emptyState: document.getElementById("empty-state"),
    installButton: document.getElementById("install-btn"),
    installDialog: document.getElementById("install-dialog"),
    importFile: document.getElementById("import-file"),
    filters: {
      status: document.getElementById("filter-status"),
      system: document.getElementById("filter-system"),
      group: document.getElementById("filter-group"),
      game: document.getElementById("filter-game"),
      numbers: document.getElementById("filter-numbers")
    }
  };

  let installPrompt = null;
  let toastTimer = null;

  const padGame = core.padGame;
  const padNumber = core.padNumber;

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
      }).format(new Date(value));
    } catch {
      return "agora";
    }
  }

  function resetStateObject() {
    Object.assign(states, core.createDefaultStates(games));
  }

  function loadStates() {
    resetStateObject();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        elements.saveStatus.textContent = "Marcações originais carregadas";
        persistStates(false);
        return;
      }
      const payload = JSON.parse(stored);
      const saved = payload && typeof payload === "object" && payload.statuses ? payload.statuses : payload;
      if (saved && typeof saved === "object") {
        for (const [id, status] of Object.entries(saved)) {
          if (gameIds.has(id) && Object.hasOwn(STATUS_LABELS, status)) states[id] = status;
        }
      }
      elements.saveStatus.textContent = payload.savedAt
        ? `Último salvamento: ${formatDate(payload.savedAt)}`
        : "Marcações salvas carregadas";
    } catch {
      elements.saveStatus.textContent = "Não foi possível ler as marcações; o padrão foi carregado";
    }
  }

  function persistStates(showFeedback = true) {
    const payload = {
      app: APP_NAME,
      wallet: WALLET,
      schema: 1,
      savedAt: new Date().toISOString(),
      statuses: states
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      elements.saveStatus.textContent = `Salvo em ${formatDate(payload.savedAt)}`;
      if (showFeedback) announce("Marcação salva");
      return true;
    } catch {
      elements.saveStatus.textContent = "Não foi possível salvar neste navegador";
      return false;
    }
  }

  function buildInterface() {
    if (games.length !== 705) {
      elements.emptyState.hidden = false;
      elements.emptyState.textContent = "A carteira oficial não foi carregada corretamente.";
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const system of SYSTEM_ORDER) {
      const systemGames = games.filter(game => game.system === system);
      const section = elements.systemTemplate.content.firstElementChild.cloneNode(true);
      section.dataset.system = system;
      section.querySelector(".system-title").textContent = system;
      section.querySelector(".system-count").textContent = `${systemGames.length} jogos`;
      const grid = section.querySelector(".games");

      for (const game of systemGames) {
        const card = elements.gameTemplate.content.firstElementChild.cloneNode(true);
        card.dataset.id = game.id;
        card.dataset.system = game.system;
        card.dataset.group = game.group;
        card.dataset.number = String(game.number);
        card.querySelector(".game-title").textContent = `Jogo ${padGame(game.number)}`;
        card.querySelector(".game-meta").textContent = `${game.system} • Grupo ${game.group}`;
        card.querySelector(".status-actions").setAttribute("aria-label", `Status do jogo ${padGame(game.number)} do bloco ${game.system}`);

        const numberContainer = card.querySelector(".numbers");
        numberContainer.setAttribute("aria-label", game.numbers.map(padNumber).join(", "));
        for (const number of game.numbers) {
          const ball = document.createElement("span");
          ball.className = "ball";
          ball.textContent = padNumber(number);
          numberContainer.appendChild(ball);
        }

        grid.appendChild(card);
        cardById.set(game.id, card);
      }

      sectionBySystem.set(system, section);
      fragment.appendChild(section);
    }

    elements.systems.replaceChildren(fragment);
    refreshAllCards();
    updateCounters();
    applyFilters();
  }

  function refreshCard(id) {
    const card = cardById.get(id);
    if (!card) return;
    const status = states[id] || "pendente";
    card.dataset.status = status;
    card.querySelector(".status-pill").textContent = STATUS_LABELS[status];
    card.querySelectorAll(".status-actions button").forEach(button => {
      const active = button.dataset.status === status;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function refreshAllCards() {
    for (const game of games) refreshCard(game.id);
  }

  function setStatus(id, status) {
    if (!gameIds.has(id) || !Object.hasOwn(STATUS_LABELS, status) || states[id] === status) return;
    states[id] = status;
    persistStates(false);
    refreshCard(id);
    updateCounters();
    applyFilters();
    const game = games.find(item => item.id === id);
    announce(`${game.system} • Jogo ${padGame(game.number)}: ${STATUS_LABELS[status]}`);
  }

  function updateCounters() {
    const count = core.countStatuses(games, states);
    document.getElementById("count-total").textContent = String(games.length);
    document.getElementById("count-pendente").textContent = String(count.pendente);
    document.getElementById("count-registrado").textContent = String(count.registrado);
    document.getElementById("count-apostado").textContent = String(count.apostado);
  }

  const parseGameFilter = core.parseGameFilter;
  const parseNumberFilter = core.parseNumberFilter;

  function applyFilters() {
    const selectedStatus = elements.filters.status.value;
    const selectedSystem = elements.filters.system.value;
    const selectedGroup = elements.filters.group.value;
    const gameNumber = parseGameFilter(elements.filters.game.value);
    const numberQuery = parseNumberFilter(elements.filters.numbers.value);
    const visibleBySystem = Object.fromEntries(SYSTEM_ORDER.map(system => [system, 0]));
    let visible = 0;

    elements.filters.game.setAttribute("aria-invalid", String(Number.isNaN(gameNumber)));
    elements.filters.numbers.setAttribute("aria-invalid", String(!numberQuery.valid));

    for (const game of games) {
      const status = states[game.id] || "pendente";
      const show = core.matchesGame(game, status, {
        status: selectedStatus,
        system: selectedSystem,
        group: selectedGroup,
        gameNumber,
        numberQuery
      });

      const card = cardById.get(game.id);
      card.hidden = !show;
      if (show) {
        visible += 1;
        visibleBySystem[game.system] += 1;
      }
    }

    for (const system of SYSTEM_ORDER) {
      const section = sectionBySystem.get(system);
      const count = visibleBySystem[system];
      section.hidden = count === 0;
      section.querySelector(".system-count").textContent = `${count} de 141 jogos`;
    }

    elements.visibleCount.textContent = String(visible);
    document.getElementById("count-visible").textContent = String(visible);
    elements.emptyState.hidden = visible !== 0;
  }

  function clearFilters() {
    elements.filters.status.value = "all";
    elements.filters.system.value = "all";
    elements.filters.group.value = "all";
    elements.filters.game.value = "";
    elements.filters.numbers.value = "";
    applyFilters();
    announce("Filtros limpos");
  }

  function exportBackup() {
    const payload = {
      app: APP_NAME,
      wallet: WALLET,
      schema: 1,
      gameCount: games.length,
      exportedAt: new Date().toISOString(),
      statuses: states
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `SU-Mega-C2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce("Backup exportado");
  }

  function validateBackup(payload) {
    return core.validateBackup(payload, games, STATUS_LABELS, APP_NAME, WALLET);
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = validateBackup(JSON.parse(String(reader.result)));
        if (!confirm("Importar este backup substituirá as marcações atuais. Deseja continuar?")) return;
        resetStateObject();
        Object.assign(states, incoming);
        persistStates(false);
        refreshAllCards();
        updateCounters();
        applyFilters();
        announce("Backup importado com sucesso");
      } catch (error) {
        alert(`Não foi possível importar o backup. ${error.message || ""}`.trim());
      }
    };
    reader.onerror = () => alert("Não foi possível ler o arquivo selecionado.");
    reader.readAsText(file);
  }

  function resetToOriginal() {
    if (!confirm("Restaurar todos os 705 jogos ao estado Pendente? Esta ação apagará as marcações atuais deste dispositivo.")) return;
    resetStateObject();
    persistStates(false);
    refreshAllCards();
    updateCounters();
    applyFilters();
    announce("Estado original restaurado");
  }

  function announce(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function showInstallHelp() {
    if (typeof elements.installDialog.showModal === "function") {
      elements.installDialog.showModal();
    } else {
      alert("No iPhone, abra no Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.");
    }
  }

  elements.systems.addEventListener("click", event => {
    const button = event.target.closest("button[data-status]");
    if (!button) return;
    const card = button.closest(".game-card");
    if (card) setStatus(card.dataset.id, button.dataset.status);
  });

  for (const filter of Object.values(elements.filters)) {
    filter.addEventListener(filter.tagName === "INPUT" ? "input" : "change", applyFilters);
  }

  document.getElementById("clear-filters").addEventListener("click", clearFilters);
  document.getElementById("export-backup").addEventListener("click", exportBackup);
  document.getElementById("print-games").addEventListener("click", () => window.print());
  document.getElementById("reset-status").addEventListener("click", resetToOriginal);
  elements.importFile.addEventListener("change", event => {
    const file = event.target.files && event.target.files[0];
    if (file) importBackup(file);
    event.target.value = "";
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
  });

  elements.installButton.addEventListener("click", async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      return;
    }
    showInstallHelp();
  });

  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY) return;
    loadStates();
    refreshAllCards();
    updateCounters();
    applyFilters();
    announce("Marcações sincronizadas com outra aba");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {
        elements.saveStatus.textContent += " • modo offline indisponível";
      });
    });
  }

  loadStates();
  buildInterface();
})();
