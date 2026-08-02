(() => {
  "use strict";

  const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
  if (isStandalone) return;

  const GATE_ID = "su-cloud-gate";
  const STATUS_ID = "su-cloud-status";
  let userOpenedLogin = false;

  function hideGateForSafariInstall() {
    const gate = document.getElementById(GATE_ID);
    if (!gate || userOpenedLogin) return;
    gate.hidden = true;
    gate.style.setProperty("display", "none", "important");
    gate.setAttribute("aria-hidden", "true");
  }

  function openGateByUser() {
    userOpenedLogin = true;
    const gate = document.getElementById(GATE_ID);
    if (!gate) return;
    gate.style.removeProperty("display");
    gate.hidden = false;
    gate.removeAttribute("aria-hidden");

    const card = gate.querySelector(".su-cloud-card");
    if (card && !document.getElementById("su-cloud-login-later")) {
      const later = document.createElement("button");
      later.id = "su-cloud-login-later";
      later.type = "button";
      later.textContent = "Agora não";
      later.style.cssText = "width:100%;margin-top:10px;background:#eef7f2;color:#0d5f3d;border:1px solid #cfe5d8";
      later.addEventListener("click", () => {
        userOpenedLogin = false;
        hideGateForSafariInstall();
      });
      card.appendChild(later);
    }
  }

  document.addEventListener("click", event => {
    if (event.target.closest(`#${STATUS_ID}`)) openGateByUser();
  }, true);

  const observer = new MutationObserver(hideGateForSafariInstall);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "style"] });
  hideGateForSafariInstall();
  setTimeout(hideGateForSafariInstall, 0);
  setTimeout(hideGateForSafariInstall, 500);
  setTimeout(hideGateForSafariInstall, 1500);
})();
