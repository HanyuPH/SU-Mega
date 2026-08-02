(() => {
  "use strict";
  if (document.getElementById("su-beta-layout-review")) return;

  const style = document.createElement("style");
  style.id = "su-beta-layout-review";
  style.textContent = `
    :root{--su-control-height:46px;--su-action-height:54px;--su-gap:10px}
    .page,.hero-inner{width:100%;max-width:1420px}
    .hero-inner,.toolbar-top,.filter-footer,.system-heading,.card-top{min-width:0}
    .brand>div,.toolbar-top>div,.card-top>div{min-width:0}
    .hero h1,.subtitle,.game-meta,.system-title{overflow-wrap:anywhere}

    .toolbar-top{display:grid!important;grid-template-columns:minmax(220px,.9fr) minmax(420px,1.1fr)!important;align-items:start!important;gap:16px!important}

    /* O painel original permanece apenas como ponte funcional e não participa do layout. */
    #wallet-view .actions{display:none!important}

    #su-stable-action-panel{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      grid-template-rows:var(--su-action-height) var(--su-action-height) var(--su-action-height)!important;
      gap:var(--su-gap)!important;
      width:100%!important;
      min-width:0!important;
      margin:0!important;
      align-self:start!important;
    }
    #su-stable-action-panel .button{
      appearance:none!important;
      -webkit-appearance:none!important;
      box-sizing:border-box!important;
      width:100%!important;
      min-width:0!important;
      min-height:var(--su-action-height)!important;
      height:var(--su-action-height)!important;
      max-height:var(--su-action-height)!important;
      margin:0!important;
      padding:10px 12px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
      line-height:1.2!important;
      white-space:normal!important;
      position:static!important;
      transform:none!important;
    }
    #su-action-export{grid-column:1;grid-row:1}
    #su-action-import{grid-column:2;grid-row:1}
    #su-action-print{grid-column:1;grid-row:2}
    #su-action-reset{grid-column:1/-1;grid-row:3}

    .filters{align-items:end!important}
    .filters label{min-width:0!important}
    .filters input,.filters select{height:var(--su-control-height)!important;min-height:var(--su-control-height)!important}
    .filter-footer{min-height:44px}
    .filter-footer .button{min-height:42px;display:flex;align-items:center;justify-content:center}
    .summary{align-items:stretch}
    .metric{min-height:88px;display:flex;flex-direction:column;justify-content:center}
    .games{align-items:stretch}
    .game-card{height:100%;display:flex;flex-direction:column}
    .numbers{margin-top:auto}
    .status-actions{margin-top:auto}
    .status-actions button{min-height:44px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.15}

    .contest-bets-box{width:100%;box-sizing:border-box}
    .contest-bets-box label{min-width:0}
    .contest-bets-box input{width:100%;min-width:0;min-height:var(--su-control-height)}
    .contest-bets-actions{align-items:stretch}
    .contest-bets-actions .button{min-height:var(--su-control-height);height:100%;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.2}

    .su-account-overlay{overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;align-items:flex-start!important;padding-top:max(18px,env(safe-area-inset-top))!important;padding-bottom:max(18px,env(safe-area-inset-bottom))!important}
    .su-account-overlay .su-account-card{margin:auto!important;max-height:none!important;overflow:visible!important}
    .su-account-grid{align-items:stretch!important}
    .su-account-item{min-height:82px!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
    .su-account-actions{align-items:stretch!important}
    .su-account-actions button{height:100%!important;min-height:48px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;line-height:1.2!important}
    .su-account-label input{width:100%!important;box-sizing:border-box!important}

    @media(max-width:900px){
      .toolbar-top{grid-template-columns:1fr!important}
      .filters{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .numbers-search{grid-column:1/-1!important}
    }
    @media(min-width:700px) and (max-width:1100px){
      .page{padding-left:20px!important;padding-right:20px!important}
      .games{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .summary{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      .su-account-overlay .su-account-card{width:min(620px,94vw)!important}
    }
    @media(max-width:620px){
      .page{padding-left:12px!important;padding-right:12px!important}
      .hero-inner{gap:10px!important}
      .brand{gap:10px!important}
      .toolbar{padding:14px!important}
      .filters{grid-template-columns:1fr 1fr!important}
      .filter-footer{align-items:stretch!important;flex-direction:column!important}
      .filter-footer .button{width:100%!important}
      .system-heading{align-items:flex-start!important}
      .system-count{padding-top:5px}
      .contest-bets-actions{grid-template-columns:1fr!important}
      .su-account-grid,.su-account-actions{grid-template-columns:1fr!important}
      .su-account-item{min-height:74px!important}
      .su-mega-eco-head{padding:24px 88px 20px 20px!important}
      .su-mega-eco-body{padding:18px!important}
    }
    @media(max-width:380px){
      #su-stable-action-panel{grid-template-columns:1fr!important;grid-template-rows:repeat(4,var(--su-action-height))!important}
      #su-action-export{grid-column:1;grid-row:1}
      #su-action-import{grid-column:1;grid-row:2}
      #su-action-print{grid-column:1;grid-row:3}
      #su-action-reset{grid-column:1;grid-row:4}
      .filters{grid-template-columns:1fr!important}
      .numbers-search{grid-column:auto!important}
      .summary{grid-template-columns:1fr 1fr!important}
      .status-actions{grid-template-columns:1fr!important}
    }
  `;
  document.head.appendChild(style);

  function triggerOriginal(id) {
    const control = document.getElementById(id);
    if (control) control.click();
  }

  function createPanel() {
    const original = document.querySelector("#wallet-view .actions");
    if (!original || document.getElementById("su-stable-action-panel")) return;

    const panel = document.createElement("div");
    panel.id = "su-stable-action-panel";
    panel.setAttribute("aria-label", "Ações da carteira");
    panel.innerHTML = `
      <button id="su-action-export" class="button primary" type="button">Exportar backup</button>
      <button id="su-action-import" class="button" type="button">Importar backup</button>
      <button id="su-action-print" class="button" type="button">Imprimir visíveis</button>
      <button id="su-action-reset" class="button danger" type="button">Restaurar padrão</button>
    `;

    original.insertAdjacentElement("afterend", panel);

    panel.querySelector("#su-action-export").addEventListener("click", () => triggerOriginal("export-backup"));
    panel.querySelector("#su-action-import").addEventListener("click", () => {
      const input = document.getElementById("import-file");
      if (input) input.click();
    });
    panel.querySelector("#su-action-print").addEventListener("click", () => triggerOriginal("print-games"));
    panel.querySelector("#su-action-reset").addEventListener("click", () => triggerOriginal("reset-status"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createPanel, { once:true });
  } else {
    createPanel();
  }
})();
