(() => {
  "use strict";
  const SYSTEM_ORDER = ["Ouro", "Diamante", "Platina", "Safira", "Ônix"];

  function normalizeDate(value) {
    const text = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : "";
  }

  function parseNumbers(value, limit = 60) {
    const source = Array.isArray(value) ? value : String(value || "").match(/\d{1,2}/g) || [];
    return [...new Set(source.map(Number).filter(number =>
      Number.isInteger(number) && number >= 1 && number <= limit
    ))].sort((a, b) => a - b);
  }

  function sanitizeContests(input) {
    if (!Array.isArray(input)) return [];
    const seen = new Set();
    const clean = [];
    for (const item of input) {
      const number = Number(item?.number);
      const numbers = parseNumbers(item?.numbers);
      const date = normalizeDate(item?.date);
      if (!Number.isInteger(number) || number < 1 || numbers.length !== 6 || seen.has(number)) continue;
      seen.add(number);
      const rawSource = String(item?.source || "").trim();
      clean.push({
        number,
        date,
        numbers,
        source: /^https?:\/\//i.test(rawSource) ? rawSource : "",
        notes: String(item?.notes || "").trim(),
        createdAt: item?.createdAt || new Date().toISOString(),
        updatedAt: item?.updatedAt || item?.createdAt || new Date().toISOString()
      });
    }
    return clean.sort((a, b) => b.number - a.number);
  }

  function calculate(contest, games, states, scope = "all") {
    const draw = new Set(contest.numbers);
    const eligible = games.filter(game => scope === "all" || states[game.id] === scope);
    const order = new Map(SYSTEM_ORDER.map((name, index) => [name, index]));
    const results = eligible.map(game => {
      const hitNumbers = game.numbers.filter(number => draw.has(number));
      return { game, hits: hitNumbers.length, hitNumbers };
    }).sort((a, b) =>
      b.hits - a.hits ||
      (order.get(a.game.system) ?? 99) - (order.get(b.game.system) ?? 99) ||
      a.game.number - b.game.number
    );

    const distribution = { 4: 0, 5: 0, 6: 0 };
    const systems = Object.fromEntries(SYSTEM_ORDER.map(name => [name, {
      name, evaluated: 0, best: 0, distribution: { 4: 0, 5: 0, 6: 0 }
    }]));

    for (const item of results) {
      if (Object.hasOwn(distribution, item.hits)) distribution[item.hits] += 1;
      const system = systems[item.game.system] || (systems[item.game.system] = {
        name: item.game.system || "Sem sistema", evaluated: 0, best: 0, distribution: { 4: 0, 5: 0, 6: 0 }
      });
      system.evaluated += 1;
      system.best = Math.max(system.best, item.hits);
      if (Object.hasOwn(system.distribution, item.hits)) system.distribution[item.hits] += 1;
    }
    const best = results.length ? results[0].hits : 0;
    return {
      scope,
      evaluated: results.length,
      results,
      distribution,
      best,
      bestGames: results.filter(item => item.hits === best),
      systems: SYSTEM_ORDER.map(name => systems[name]).filter(Boolean)
    };
  }

  function parseCsvLine(line) {
    const values = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
        else quoted = !quoted;
      } else if ((char === "," || char === ";") && !quoted) {
        values.push(value.trim());
        value = "";
      } else value += char;
    }
    values.push(value.trim());
    return values;
  }

  function parseCsv(text) {
    const records = [];
    for (const line of String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/)) {
      if (!line.trim()) continue;
      const values = parseCsvLine(line);
      const number = Number(values[0]);
      if (!Number.isInteger(number) || number < 1) continue;
      const date = normalizeDate(values[1]);
      const numbers = parseNumbers(values.slice(2));
      if (!date || numbers.length !== 6) continue;
      records.push({ number, date, numbers, source: "", notes: "Importado por CSV." });
    }
    return sanitizeContests(records);
  }

  globalThis.SUMegaContestCore = Object.freeze({
    SYSTEM_ORDER, normalizeDate, parseNumbers, sanitizeContests, calculate, parseCsvLine, parseCsv
  });
})();
