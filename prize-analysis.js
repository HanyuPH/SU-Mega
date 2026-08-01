(() => {
  "use strict";
  const ARCHIVE_URL = "./data/concursos-oficiais.json";
  const CAIXA_API = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena";
  let timer = null;
  let cachedContest = null;
  let cachedTiers = null;

  function money(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
  }

  function normalizeTiers(payload) {
    const raw = payload?.prizeTiers ?? payload?.listaRateioPremio ?? [];
    return Array.isArray(raw) ? raw.map(item => {
      const description = String(item.description ?? item.descricaoFaixa ?? "");
      const hits = Number(item.hits ?? description.match(/\d+/)?.[0] ?? (7 - Number(item.faixa || 0)));
      const prize = Math.max(0, Number(item.prize ?? item.valorPremio) || 0);
      return { hits, prize };
    }).filter(item => item.hits >= 4 && item.hits <= 6) : [];
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function getTiers(contestNumber) {
    if (cachedContest === contestNumber && cachedTiers) return cachedTiers;
    let payload = null;
    try {
      const archive = await fetchJson(ARCHIVE_URL);
      const items = Array.isArray(archive) ? archive : archive?.results || [];
      payload = items.find(item => Number(item.number ?? item.numero) === contestNumber) || null;
    } catch {}
    if (!payload) {
      try { payload = await fetchJson(`${CAIXA_API}/${contestNumber}`); } catch {}
    }
    cachedContest = contestNumber;
    cachedTiers = normalizeTiers(payload);
    return cachedTiers;
  }

  function ensureStyles() {
    if (document.getElementById("su-prize-analysis-style")) return;
    const style = document.createElement("style");
    style.id = "su-prize-analysis-style";
    style.textContent = `
      .su-prize-summary{margin:18px 0;padding:18px;border:1px solid #cfe5d8;border-radius:18px;background:#f3faf6}
      .su-prize-summary h3{margin:0 0 12px}.su-prize-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .su-prize-grid article{padding:12px;border:1px solid #d7eadf;border-radius:14px;background:#fff;min-width:0}.su-prize-grid span{display:block;color:#66736c;font-size:.8rem}.su-prize-grid strong{display:block;margin-top:4px;overflow-wrap:anywhere}
      .su-prize-total{background:#e8f7ee!important;border-color:#b9ddc8!important}.game-return{margin-top:10px;padding:9px 11px;border-radius:12px;background:#edf8f1;color:#0f6b48;font-weight:800;display:flex;justify-content:space-between;gap:12px}.game-return.none{background:#f5f5f5;color:#6b7280}
      @media(max-width:700px){.su-prize-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  async function enhance() {
    const analysis = document.getElementById("contest-analysis");
    if (!analysis || analysis.hidden) return;
    const title = analysis.querySelector(".analysis-head h2")?.textContent || "";
    const contestNumber = Number(title.match(/\d+/)?.[0]);
    if (!contestNumber) return;
    const cards = [...analysis.querySelectorAll(".checked-game")];
    if (!cards.length) return;
    ensureStyles();
    const tiers = await getTiers(contestNumber);
    const prizeMap = new Map(tiers.map(item => [item.hits, item.prize]));
    const counts = { 4: 0, 5: 0, 6: 0 };
    let total = 0;

    for (const card of cards) {
      card.querySelector(".game-return")?.remove();
      const hits = Number(card.querySelector(".score-badge")?.textContent.match(/\d+/)?.[0] || 0);
      const prize = prizeMap.get(hits) || 0;
      if (counts[hits] !== undefined) counts[hits] += 1;
      total += prize;
      const row = document.createElement("div");
      row.className = `game-return${prize ? "" : " none"}`;
      row.innerHTML = `<span>Retorno deste jogo</span><strong>${prize ? money(prize) : "Sem prêmio"}</strong>`;
      card.appendChild(row);
    }

    analysis.querySelector(".su-prize-summary")?.remove();
    const metrics = analysis.querySelector(".analysis-metrics");
    const summary = document.createElement("section");
    summary.className = "su-prize-summary";
    if (!tiers.length) {
      summary.innerHTML = `<h3>Retorno financeiro</h3><p>Os valores de premiação ainda não estão disponíveis para este concurso.</p>`;
    } else {
      summary.innerHTML = `<h3>Retorno financeiro dos jogos conferidos</h3><div class="su-prize-grid">
        <article><span>Quadras premiadas</span><strong>${counts[4]} × ${money(prizeMap.get(4) || 0)}</strong></article>
        <article><span>Quinas premiadas</span><strong>${counts[5]} × ${money(prizeMap.get(5) || 0)}</strong></article>
        <article><span>Senas premiadas</span><strong>${counts[6]} × ${money(prizeMap.get(6) || 0)}</strong></article>
        <article class="su-prize-total"><span>Retorno total</span><strong>${money(total)}</strong></article>
      </div>`;
    }
    metrics?.insertAdjacentElement("afterend", summary);
  }

  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(enhance, 180);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("change", event => {
    if (event.target?.id === "contest-scope") setTimeout(enhance, 250);
  });
  setTimeout(enhance, 1000);
})();