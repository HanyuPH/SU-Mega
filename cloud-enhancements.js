import { getApps, getApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const STATUS_KEY = "su-mega-c2-status-v1";
const CONTEST_KEY = "su-mega-c2-contests-v1";
const DEVICE_NAME_KEY = "su-mega-device-name-v1";
const LAST_BACKUP_KEY = "su-mega-last-auto-backup-v1";
const APP_ID = "su-mega";
const APP_VERSION = "C2";

const app = getApps().length ? getApp() : null;
if (!app) throw new Error("Firebase ainda não foi inicializado pelo SU Mega Cloud.");
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;
let panel = null;
let lastState = "offline";
let lastSyncAt = null;
let automaticBackupBusy = false;

function parseJson(value, fallback) {
  try { return JSON.parse(value ?? ""); } catch { return fallback; }
}

function defaultDeviceName() {
  const ua = navigator.userAgent || "";
  if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/Macintosh/i.test(ua)) return "Mac";
  return "Dispositivo";
}

function deviceName() {
  return localStorage.getItem(DEVICE_NAME_KEY) || defaultDeviceName();
}

function formatDate(value) {
  if (!value) return "Ainda não sincronizado";
  try { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(value); }
  catch { return value.toLocaleString("pt-BR"); }
}

function injectStyles() {
  if (document.getElementById("su-cloud-enhancements-style")) return;
  const style = document.createElement("style");
  style.id = "su-cloud-enhancements-style";
  style.textContent = `
    .su-profile-panel{position:fixed;inset:0;z-index:10020;background:#061c17d9;display:grid;place-items:center;padding:22px;font-family:inherit}.su-profile-panel[hidden]{display:none}
    .su-profile-card{width:min(520px,100%);max-height:min(760px,92vh);overflow:auto;background:#fff;border-radius:24px;padding:24px;color:#17202a;box-shadow:0 26px 80px #0008}
    .su-profile-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.su-profile-head h2{margin:3px 0 6px}.su-profile-head p{margin:0;color:#64748b}.su-close{border:0;background:#eef2f7;border-radius:999px;width:40px;height:40px;font-size:22px}
    .su-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}.su-profile-metric{background:#f6faf8;border:1px solid #d9e9e1;border-radius:15px;padding:13px}.su-profile-metric span{display:block;color:#64748b;font-size:12px;font-weight:700}.su-profile-metric strong{display:block;margin-top:4px;word-break:break-word}
    .su-profile-card label{display:grid;gap:7px;font-weight:800;margin:14px 0}.su-profile-card input{font:inherit;padding:12px;border:1px solid #cbd5e1;border-radius:12px}.su-profile-actions{display:grid;gap:10px;margin-top:18px}.su-profile-actions button{font:inherit;font-weight:800;border-radius:12px;border:1px solid #cbd5e1;padding:12px;background:#fff}.su-profile-actions .primary{background:#16834f;color:#fff;border-color:#16834f}.su-profile-actions .warning{color:#9a3412;background:#fff7ed;border-color:#fed7aa}.su-profile-note{font-size:13px;color:#64748b;line-height:1.45;margin-top:16px}
    @media(max-width:520px){.su-profile-grid{grid-template-columns:1fr}.su-profile-card{padding:20px}}
  `;
  document.head.appendChild(style);
}

function injectPanel() {
  if (document.getElementById("su-profile-panel")) return;
  injectStyles();
  panel = document.createElement("section");
  panel.id = "su-profile-panel";
  panel.className = "su-profile-panel";
  panel.hidden = true;
  panel.innerHTML = `<div class="su-profile-card" role="dialog" aria-modal="true" aria-labelledby="su-profile-title">
    <div class="su-profile-head"><div><small style="color:#16834f;font-weight:900">ECOSSISTEMA SU</small><h2 id="su-profile-title">Conta e sincronização</h2><p>Uma conta privada para SU Mega e futuros aplicativos SU.</p></div><button id="su-profile-close" class="su-close" aria-label="Fechar">×</button></div>
    <div class="su-profile-grid">
      <div class="su-profile-metric"><span>Conta</span><strong id="su-profile-email">—</strong></div>
      <div class="su-profile-metric"><span>Estado</span><strong id="su-profile-state">—</strong></div>
      <div class="su-profile-metric"><span>Última sincronização</span><strong id="su-profile-last-sync">—</strong></div>
      <div class="su-profile-metric"><span>Último backup automático</span><strong id="su-profile-last-backup">—</strong></div>
    </div>
    <label>Nome deste dispositivo<input id="su-device-name" maxlength="40" placeholder="Ex.: iPhone pessoal"></label>
    <div class="su-profile-actions">
      <button id="su-save-device" class="primary" type="button">Salvar nome do dispositivo</button>
      <button id="su-sync-now" type="button">Sincronizar agora</button>
      <button id="su-backup-now" type="button">Criar backup automático agora</button>
      <button id="su-restore-cloud-backup" class="warning" type="button">Restaurar último backup automático</button>
    </div>
    <p id="su-profile-message" class="su-profile-note">Os 705 jogos permanecem fixos. A nuvem armazena apenas dados operacionais e backups.</p>
  </div>`;
  document.body.appendChild(panel);
  document.getElementById("su-profile-close").addEventListener("click", () => panel.hidden = true);
  panel.addEventListener("click", event => { if (event.target === panel) panel.hidden = true; });
  document.getElementById("su-save-device").addEventListener("click", saveDeviceName);
  document.getElementById("su-sync-now").addEventListener("click", syncNow);
  document.getElementById("su-backup-now").addEventListener("click", () => createAutomaticBackup(true));
  document.getElementById("su-restore-cloud-backup").addEventListener("click", restoreAutomaticBackup);
}

function observeCloudBadge() {
  const badge = document.getElementById("su-cloud-status");
  const text = document.getElementById("su-cloud-status-text");
  if (!badge || !text) return setTimeout(observeCloudBadge, 500);
  badge.addEventListener("click", event => {
    if (user) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPanel();
    }
  }, true);
  const update = () => {
    lastState = badge.dataset.state || "offline";
    if (lastState === "synced") {
      lastSyncAt = new Date();
      maybeAutomaticBackup();
    }
    refreshPanel();
  };
  new MutationObserver(update).observe(badge, { attributes: true, attributeFilter: ["data-state"] });
  new MutationObserver(update).observe(text, { childList: true, characterData: true, subtree: true });
  update();
}

function openPanel() {
  injectPanel();
  document.getElementById("su-device-name").value = deviceName();
  refreshPanel();
  panel.hidden = false;
}

function refreshPanel() {
  if (!panel) return;
  document.getElementById("su-profile-email").textContent = user?.email || "Não conectado";
  document.getElementById("su-profile-state").textContent = ({ synced: "Sincronizado", saving: "Sincronizando", offline: "Offline", error: "Erro" })[lastState] || lastState;
  document.getElementById("su-profile-last-sync").textContent = formatDate(lastSyncAt);
  const backupDate = localStorage.getItem(LAST_BACKUP_KEY);
  document.getElementById("su-profile-last-backup").textContent = backupDate ? formatDate(new Date(backupDate)) : "Nenhum backup automático";
}

function message(text) {
  const el = document.getElementById("su-profile-message");
  if (el) el.textContent = text;
}

async function saveDeviceName() {
  const value = document.getElementById("su-device-name").value.trim() || defaultDeviceName();
  localStorage.setItem(DEVICE_NAME_KEY, value);
  if (user) await setDoc(doc(db, "users", user.uid, "settings", "ecosystem"), {
    primaryApp: APP_ID,
    apps: [APP_ID],
    lastDeviceName: value,
    updatedAt: serverTimestamp()
  }, { merge: true });
  message(`Dispositivo identificado como “${value}”.`);
}

async function logActivity(type, details = {}) {
  if (!user) return;
  try {
    await addDoc(collection(db, "users", user.uid, "activity"), {
      app: APP_ID,
      version: APP_VERSION,
      type,
      deviceName: deviceName(),
      createdAt: serverTimestamp(),
      ...details
    });
  } catch (error) { console.warn("SU activity:", error); }
}

function backupPayload() {
  return {
    app: "SU Mega",
    appId: APP_ID,
    wallet: APP_VERSION,
    schema: 3,
    deviceName: deviceName(),
    createdAtLocal: new Date().toISOString(),
    statuses: parseJson(localStorage.getItem(STATUS_KEY), {}),
    contests: parseJson(localStorage.getItem(CONTEST_KEY), [])
  };
}

async function createAutomaticBackup(manual = false) {
  if (!user || automaticBackupBusy) return;
  automaticBackupBusy = true;
  message("Criando backup na nuvem…");
  try {
    const payload = backupPayload();
    await setDoc(doc(db, "users", user.uid, "backups", "su-mega-latest"), { ...payload, createdAt: serverTimestamp() });
    const now = new Date().toISOString();
    localStorage.setItem(LAST_BACKUP_KEY, now);
    await logActivity(manual ? "backup-manual-cloud" : "backup-automatico", { backupAt: now });
    message("Backup automático concluído.");
    refreshPanel();
  } catch (error) {
    console.error(error);
    message(`Falha no backup: ${error.code || error.message}`);
  } finally { automaticBackupBusy = false; }
}

async function maybeAutomaticBackup() {
  if (!user || !navigator.onLine) return;
  const last = localStorage.getItem(LAST_BACKUP_KEY);
  if (!last || Date.now() - new Date(last).getTime() >= 24 * 60 * 60 * 1000) await createAutomaticBackup(false);
}

async function restoreAutomaticBackup() {
  if (!user) return;
  if (!confirm("Restaurar o último backup automático? As marcações e concursos atuais serão substituídos.")) return;
  message("Buscando backup…");
  try {
    const snap = await getDoc(doc(db, "users", user.uid, "backups", "su-mega-latest"));
    if (!snap.exists()) return message("Nenhum backup automático foi encontrado.");
    const data = snap.data();
    if (data.statuses != null) localStorage.setItem(STATUS_KEY, JSON.stringify(data.statuses));
    if (data.contests != null) localStorage.setItem(CONTEST_KEY, JSON.stringify(data.contests));
    window.dispatchEvent(new StorageEvent("storage", { key: STATUS_KEY, newValue: localStorage.getItem(STATUS_KEY) }));
    window.dispatchEvent(new StorageEvent("storage", { key: CONTEST_KEY, newValue: localStorage.getItem(CONTEST_KEY) }));
    await logActivity("backup-restaurado");
    message("Backup restaurado e enviado para sincronização.");
  } catch (error) {
    console.error(error);
    message(`Falha na restauração: ${error.code || error.message}`);
  }
}

async function syncNow() {
  if (!user) return;
  message("Solicitando sincronização…");
  try {
    await setDoc(doc(db, "users", user.uid, "settings", "ecosystem"), {
      primaryApp: APP_ID,
      apps: [APP_ID],
      lastDeviceName: deviceName(),
      lastManualSyncAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    lastSyncAt = new Date();
    await logActivity("sincronizacao-manual");
    message("Sincronização confirmada.");
    refreshPanel();
  } catch (error) {
    console.error(error);
    message(`Falha ao sincronizar: ${error.code || error.message}`);
  }
}

window.addEventListener("su-mega-local-storage-change", event => {
  if (!user) return;
  if (event.detail?.key === STATUS_KEY) logActivity("status-alterado", { source: "localStorage" });
  if (event.detail?.key === CONTEST_KEY) logActivity("concursos-alterados", { source: "localStorage" });
});

onAuthStateChanged(auth, async current => {
  user = current;
  refreshPanel();
  if (!user) return;
  try {
    await setDoc(doc(db, "users", user.uid, "settings", "ecosystem"), {
      primaryApp: APP_ID,
      apps: [APP_ID],
      email: user.email || "",
      lastDeviceName: deviceName(),
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    await maybeAutomaticBackup();
  } catch (error) { console.warn("SU ecosystem:", error); }
});

injectPanel();
observeCloudBadge();
