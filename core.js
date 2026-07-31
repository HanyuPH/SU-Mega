(() => {
  "use strict";

  function padGame(value) {
    return String(value).padStart(3, "0");
  }

  function padNumber(value) {
    return String(value).padStart(2, "0");
  }

  function createDefaultStates(games) {
    const states = Object.create(null);
    for (const game of games) states[game.id] = "pendente";
    return states;
  }

  function countStatuses(games, states) {
    const count = { pendente: 0, registrado: 0, apostado: 0 };
    for (const game of games) {
      const status = states[game.id] || "pendente";
      if (Object.hasOwn(count, status)) count[status] += 1;
    }
    return count;
  }

  function parseGameFilter(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    if (!digits) return null;
    const value = Number(digits);
    return Number.isInteger(value) && value >= 1 && value <= 141 ? value : Number.NaN;
  }

  function parseNumberFilter(raw) {
    const text = String(raw || "").trim();
    if (!text) return { values: [], valid: true };
    const tokens = text.match(/\d{1,2}/g) || [];
    const values = [...new Set(tokens.map(Number))];
    const hasNonSeparators = text.replace(/\d{1,2}/g, "").replace(/[\s,;.+/-]/g, "").length > 0;
    const valid = !hasNonSeparators && values.length > 0 && values.every(value => value >= 1 && value <= 60);
    return { values, valid };
  }

  function matchesGame(game, currentStatus, filters) {
    const numberQuery = filters.numberQuery || { values: [], valid: true };
    return (
      (filters.status === "all" || filters.status === currentStatus) &&
      (filters.system === "all" || filters.system === game.system) &&
      (filters.group === "all" || filters.group === game.group) &&
      (filters.gameNumber === null || (!Number.isNaN(filters.gameNumber) && game.number === filters.gameNumber)) &&
      numberQuery.valid &&
      numberQuery.values.every(value => game.numbers.includes(value))
    );
  }

  function validateBackup(payload, games, statusLabels, appName, wallet) {
    if (!payload || typeof payload !== "object") throw new Error("Formato inválido.");
    if (payload.app && payload.app !== appName) throw new Error("O backup pertence a outro aplicativo.");
    if (payload.wallet && payload.wallet !== wallet) throw new Error("O backup pertence a outra carteira.");
    const incoming = payload.statuses || payload;
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) throw new Error("Marcações ausentes.");

    const result = Object.create(null);
    let validCount = 0;
    for (const game of games) {
      const status = incoming[game.id];
      if (status === undefined) continue;
      if (!Object.hasOwn(statusLabels, status)) throw new Error(`Status inválido no jogo ${game.id}.`);
      result[game.id] = status;
      validCount += 1;
    }
    if (validCount === 0) throw new Error("Nenhuma marcação compatível foi encontrada.");
    return result;
  }

  globalThis.SUMegaCore = Object.freeze({
    padGame,
    padNumber,
    createDefaultStates,
    countStatuses,
    parseGameFilter,
    parseNumberFilter,
    matchesGame,
    validateBackup
  });
})();
