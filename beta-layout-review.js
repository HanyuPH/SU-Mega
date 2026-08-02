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
    .actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-rows:var(--su-action-height)!important;align-items:stretch!important;gap:var(--su-gap)!important;width:100%!important;margin:0!important}
    .actions input[hidden]{display:none!important}
    .actions>.button,.actions>label.button{box-sizing:border-box!important;width:100%!important;min-width:0!important;min-height:var(--su-action-height)!important;height:var(--su-action-height)!important;max-height:var(--su-action-height)!important;align-self:stretch!important;margin:0!important;padding:10px 12px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;line-height:1.2!important;white-space:normal!important;transform:none!important}
    .actions .danger{grid-column:1/-1!important}

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
      .actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}
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
      .actions{grid-template-columns:1fr 1fr!important}
      .actions .danger{grid-column:1/-1!important}
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
      .actions,.filters{grid-template-columns:1fr!important}
      .actions .danger,.numbers-search{grid-column:auto!important}
      .summary{grid-template-columns:1fr 1fr!important}
      .status-actions{grid-template-columns:1fr!important}
    }
  `;
  document.head.appendChild(style);

  const normalizeActions = () => {
    const actions = document.querySelector("#wallet-view .actions");
    if (!actions) return;
    const controls = actions.querySelectorAll(":scope > .button, :scope > label.button");
    controls.forEach(control => {
      control.style.setProperty("height", "54px", "important");
      control.style.setProperty("min-height", "54px", "important");
      control.style.setProperty("max-height", "54px", "important");
      control.style.setProperty("display", "flex", "important");
      control.style.setProperty("align-items", "center", "important");
      control.style.setProperty("justify-content", "center", "important");
      control.style.setProperty("margin", "0", "important");
      control.style.setProperty("padding", "10px 12px", "important");
      control.style.setProperty("box-sizing", "border-box", "important");
    });
    const importLabel = actions.querySelector('label[for="import-file"]');
    if (importLabel) {
      importLabel.style.setProperty("position", "relative", "important");
      importLabel.style.setProperty("top", "0", "important");
      importLabel.style.setProperty("transform", "translate3d(0,0,0)", "important");
    }
    void actions.offsetHeight;
  };

  const scheduleNormalize = () => {
    requestAnimationFrame(() => requestAnimationFrame(normalizeActions));
    setTimeout(normalizeActions, 80);
    setTimeout(normalizeActions, 220);
  };

  document.querySelectorAll(".view-tab").forEach(tab => {
    tab.addEventListener("click", scheduleNormalize, { passive: true });
  });

  const wallet = document.getElementById("wallet-view");
  if (wallet) {
    new MutationObserver(() => {
      if (!wallet.hidden) scheduleNormalize();
    }).observe(wallet, { attributes: true, attributeFilter: ["hidden", "class", "style"] });
  }

  window.addEventListener("pageshow", scheduleNormalize, { passive: true });
  window.addEventListener("orientationchange", scheduleNormalize, { passive: true });
  scheduleNormalize();
})();
