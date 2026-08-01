(() => {
  "use strict";
  const KEY="su-mega-c2-contest-bets-v1";
  const PRICE_KEY="su-mega-bet-price-v1";
  const app=globalThis.SUMegaApp;
  if(!app)return;
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
  const save=data=>localStorage.setItem(KEY,JSON.stringify(data));
  const fmt=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
  function inject(){
    const host=document.querySelector(".contest-tools-card .tool-stack")||document.getElementById("contests-view");
    if(!host||document.getElementById("su-contest-bets"))return false;
    const box=document.createElement("section");box.id="su-contest-bets";box.className="contest-bets-box";
    box.innerHTML=`<h3>Apostas por concurso</h3><p>Salve uma fotografia dos jogos atualmente marcados como Apostado para um concurso específico.</p><label><span>Concurso</span><input id="su-bet-contest" type="number" min="1" inputmode="numeric" placeholder="Ex.: 3052"></label><label><span>Valor por aposta</span><input id="su-bet-price" type="number" min="0" step="0.01" value="${localStorage.getItem(PRICE_KEY)||"6.00"}"></label><div class="contest-bets-actions"><button id="su-save-contest-bets" class="button primary" type="button">Registrar apostas atuais</button><button id="su-delete-contest-bets" class="button danger" type="button">Excluir registro</button></div><div id="su-bet-summary" class="contest-bets-summary">Nenhum concurso selecionado.</div>`;
    host.appendChild(box);
    const style=document.createElement("style");style.textContent=`.contest-bets-box{margin-top:14px;padding:16px;border:1px solid #d8e7df;border-radius:16px;background:#f7fbf8}.contest-bets-box h3{margin:0 0 6px}.contest-bets-box p{margin:0 0 12px;color:#647067}.contest-bets-box label{display:grid;gap:6px;margin:10px 0;font-weight:800}.contest-bets-box input{font:inherit;padding:11px;border:1px solid #cddbd3;border-radius:10px}.contest-bets-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.contest-bets-summary{margin-top:12px;padding:12px;border-radius:12px;background:#fff;border:1px solid #dde8e1;line-height:1.5}@media(max-width:560px){.contest-bets-actions{grid-template-columns:1fr}}`;document.head.appendChild(style);
    const number=document.getElementById("su-bet-contest"),price=document.getElementById("su-bet-price"),summary=document.getElementById("su-bet-summary");
    function render(){const n=String(number.value||"").trim(),data=load(),row=data[n];if(!n){summary.textContent="Nenhum concurso selecionado.";return}if(!row){summary.textContent=`Concurso ${n}: nenhuma aposta vinculada.`;return}summary.innerHTML=`<strong>Concurso ${n}</strong><br>${row.gameIds.length} jogos apostados • ${fmt(row.totalInvested)}<br><small>Registrado em ${new Date(row.savedAt).toLocaleString("pt-BR")}</small>`}
    number.addEventListener("input",render);price.addEventListener("change",()=>localStorage.setItem(PRICE_KEY,price.value));
    document.getElementById("su-save-contest-bets").onclick=()=>{const n=Number(number.value),unit=Number(price.value);if(!Number.isInteger(n)||n<1)return alert("Informe um concurso válido.");if(!(unit>=0))return alert("Informe um valor válido.");const ids=app.games.filter(g=>app.states[g.id]==="apostado").map(g=>g.id);if(!ids.length&&!confirm("Nenhum jogo está marcado como Apostado. Salvar mesmo assim?"))return;const data=load();data[n]={contest:n,gameIds:ids,unitPrice:unit,totalInvested:ids.length*unit,savedAt:new Date().toISOString()};save(data);localStorage.setItem(PRICE_KEY,String(unit));render();app.announce?.("Apostas do concurso registradas");window.dispatchEvent(new CustomEvent("su:contest-bets-updated",{detail:data[n]}));};
    document.getElementById("su-delete-contest-bets").onclick=()=>{const n=String(number.value||"").trim();if(!n)return;const data=load();if(!data[n])return;if(!confirm(`Excluir as apostas vinculadas ao concurso ${n}?`))return;delete data[n];save(data);render();app.announce?.("Registro de apostas excluído")};
    return true;
  }
  if(!inject()){const t=setInterval(()=>{if(inject())clearInterval(t)},300);setTimeout(()=>clearInterval(t),15000)}
  globalThis.SUMegaContestBets={get:contest=>load()[String(contest)]||null,all:load};
})();