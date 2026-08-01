(() => {
  const STYLE_ID = "su-mega-ecosystem-professional-style-v2";
  const DEVICE_NAME_KEY = "su-mega-device-name-v1";

  function detectedDevice() {
    const saved = localStorage.getItem(DEVICE_NAME_KEY)?.trim();
    if (saved) return saved;
    const ua = navigator.userAgent || "";
    if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/Mac/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows";
    return "Dispositivo atual";
  }

  const apply = () => {
    const overlay = document.getElementById("su-account-panel");
    const card = overlay?.querySelector(".su-account-card");
    if (!overlay || !card) return false;

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        .su-account-overlay{background:linear-gradient(145deg,#052e22f3,#0b4a36f3)!important;backdrop-filter:blur(14px);padding:20px!important}
        .su-account-overlay .su-account-card{width:min(540px,100%)!important;max-height:90vh!important;border-radius:28px!important;padding:0!important;overflow:auto!important;background:#fff!important;box-shadow:0 30px 90px #0008!important}
        .su-mega-eco-head{position:relative;padding:26px 26px 20px;background:linear-gradient(135deg,#0f6b48,#159461);color:#fff}
        .su-mega-eco-kicker{margin:0 0 6px;font-size:.78rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase;opacity:.92}
        .su-mega-eco-head h2{margin:0;font-size:1.58rem;line-height:1.2}.su-mega-eco-sub{margin:8px 0 0;opacity:.9;line-height:1.45;max-width:430px}
        .su-mega-eco-close{position:absolute;right:18px;top:18px;border:1px solid #ffffff55!important;background:#ffffff20!important;color:#fff!important;border-radius:999px!important;padding:8px 12px!important;font-size:.92rem!important}
        .su-mega-eco-body{padding:22px}.su-mega-eco-user{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid #d7eadf;border-radius:18px;background:#f5fbf7;margin-bottom:16px}
        .su-mega-eco-avatar{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#0f6b48;color:#fff;font-weight:900;flex:0 0 auto}
        .su-mega-eco-user span{display:block;color:#6b7280;font-size:.82rem}.su-mega-eco-user strong{display:block;margin-top:3px;overflow-wrap:anywhere}
        .su-account-grid{grid-template-columns:1fr 1fr!important;gap:10px!important;margin:0 0 16px!important}.su-account-item{background:#f4faf6!important;border:1px solid #d9ebe0!important;border-radius:16px!important;padding:13px!important;min-width:0}
        .su-account-item span{font-size:.76rem!important;text-transform:uppercase;letter-spacing:.045em!important;color:#68766d!important}.su-account-item strong{font-size:.98rem!important;margin-top:5px!important;overflow-wrap:anywhere}
        .su-account-label{display:grid!important;gap:7px!important;margin:14px 0 16px!important;font-weight:800!important}.su-account-label input{margin:0!important;background:#fff!important;border:1px solid #cadfd1!important;min-height:46px}
        .su-account-actions{grid-template-columns:1fr 1fr!important;gap:10px!important}.su-account-actions button{width:100%!important;min-height:46px!important;padding:12px 14px!important;background:#eef7f1!important;color:#184d37!important;border:1px solid #d5e7dc!important;box-shadow:none!important;font-size:.96rem!important}
        #su-sync-now,#su-save-device{background:#0f6b48!important;color:#fff!important;border-color:#0f6b48!important}#su-backup-now{background:#e9f7ef!important;color:#0f6b48!important}#su-restore-backup{background:#fff8e8!important;color:#8b5a00!important;border-color:#f2dfad!important}
        #su-account-logout{grid-column:1/-1;background:#fff1f2!important;color:#b42335!important;border-color:#fecdd3!important}.su-account-message{padding:0 2px!important;margin-top:14px!important}
        @media(max-width:560px){.su-account-grid,.su-account-actions{grid-template-columns:1fr!important}#su-account-logout{grid-column:auto}.su-mega-eco-head{padding-right:82px}.su-mega-eco-body{padding:18px}}
      `;
      document.head.appendChild(style);
    }

    if (!card.dataset.professionalV2) {
      card.dataset.professionalV2 = "true";
      const close = document.getElementById("su-account-close");
      const email = document.getElementById("su-account-email");
      const grid = card.querySelector(".su-account-grid");
      const label = card.querySelector(".su-account-label");
      const actions = card.querySelector(".su-account-actions");
      const message = document.getElementById("su-account-message");

      if (grid && !document.getElementById("su-account-device-card")) {
        const device = document.createElement("article");
        device.id = "su-account-device-card";
        device.className = "su-account-item";
        device.innerHTML = `<span>Dispositivo</span><strong id="su-account-device-value">${detectedDevice()}</strong>`;
        const backup = document.getElementById("su-account-last-backup")?.closest(".su-account-item");
        if (backup) grid.insertBefore(device, backup); else grid.appendChild(device);
      }

      const head = document.createElement("div");
      head.className = "su-mega-eco-head";
      head.innerHTML = `<p class="su-mega-eco-kicker">Ecossistema SU</p><h2>Conta e sincronização</h2><p class="su-mega-eco-sub">A mesma conta conecta o SU Mega e o SU Loto com dados separados e privados.</p>`;
      if (close) { close.className = "su-mega-eco-close"; close.textContent = "Fechar"; head.appendChild(close); }

      const body = document.createElement("div");
      body.className = "su-mega-eco-body";
      const user = document.createElement("div");
      user.className = "su-mega-eco-user";
      user.innerHTML = `<div class="su-mega-eco-avatar">SU</div><div><span>Conta conectada</span><strong id="su-mega-eco-email-copy">${email?.textContent || "—"}</strong></div>`;
      body.appendChild(user); if (grid) body.appendChild(grid); if (label) body.appendChild(label); if (actions) body.appendChild(actions); if (message) body.appendChild(message);
      card.replaceChildren(head, body);

      const refresh = () => {
        const copy = document.getElementById("su-mega-eco-email-copy");
        if (copy && email) copy.textContent = email.textContent;
        const device = document.getElementById("su-account-device-value");
        if (device) device.textContent = detectedDevice();
      };
      if (email) new MutationObserver(refresh).observe(email,{childList:true,characterData:true,subtree:true});
      document.getElementById("su-save-device")?.addEventListener("click",()=>setTimeout(refresh,50));
      refresh();
    }
    return true;
  };

  if (!apply()) { const timer=setInterval(()=>{if(apply())clearInterval(timer)},250); setTimeout(()=>clearInterval(timer),15000); }
})();
