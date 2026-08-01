import { getApps, getApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const APP_NAME = "su-mega-cloud-v2";
const app = getApps().find(item => item.name === APP_NAME) || getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const STATUS_KEY = "su-mega-c2-status-v1";
const CONTEST_KEY = "su-mega-c2-contests-v1";
const DEVICE_NAME_KEY = "su-mega-device-name-v1";
const LAST_SYNC_KEY = "su-mega-last-sync-v1";
let currentUser = null;

function formatDate(value) {
  if (!value) return "Ainda não registrado";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Ainda não registrado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function announce(message) {
  globalThis.SUMegaApp?.announce?.(message);
}

function localSnapshot() {
  let statuses = {};
  let contests = [];
  try {
    const raw = JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
    statuses = raw?.statuses || raw || {};
  } catch {}
  try {
    const raw = JSON.parse(localStorage.getItem(CONTEST_KEY) || "[]");
    contests = Array.isArray(raw) ? raw : [];
  } catch {}
  return { statuses, contests };
}

function injectPanel() {
  if (document.getElementById("su-account-panel")) return;
  const style = document.createElement("style");
  style.textContent = `
    .su-account-overlay{position:fixed;inset:0;z-index:11000;background:#062f20e8;display:grid;place-items:center;padding:20px}.su-account-overlay[hidden]{display:none}
    .su-account-card{width:min(620px,100%);max-height:min(88vh,760px);overflow:auto;background:#fff;border-radius:24px;padding:24px;color:#17202a;box-shadow:0 24px 80px #0007}
    .su-account-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.su-account-head p{margin:0;color:#16834f;font-weight:900}.su-account-head h2{margin:4px 0 0}.su-account-close{border:0;background:#eef2f0;border-radius:12px;padding:10px 13px;font-size:18px}
    .su-account-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0}.su-account-item{background:#f4f8f6;border:1px solid #dce8e1;border-radius:16px;padding:14px}.su-account-item span{display:block;color:#66736c;font-size:.82rem}.su-account-item strong{display:block;margin-top:5px;overflow-wrap:anywhere}
    .su-account-label{display:grid;gap:7px;font-weight:800;margin:14px 0}.su-account-label input{font:inherit;border:1px solid #cad8d0;border-radius:12px;padding:12px}
    .su-account-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.su-account-actions button{font:inherit;font-weight:800;border:1px solid #cbd5e1;border-radius:12px;padding:12px;background:#fff}.su-account-actions .primary{background:#16834f;color:#fff;border-color:#16834f}.su-account-actions .danger{color:#b42332}.su-account-message{min-height:1.5em;margin:14px 0 0;color:#12643f;font-weight:800}
    @media(max-width:560px){.su-account-grid,.su-account-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "su-account-panel";
  overlay.className = "su-account-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `<section class="su-account-card" role="dialog" aria-modal="true" aria-labelledby="su-account-title">
    <div class="su-account-head"><div><p>ECOSSISTEMA SU</p><h2 id="su-account-title">Conta e sincronização</h2></div><button id="su-account-close" class="su-account-close" type="button" aria-label="Fechar">✕</button></div>
    <div class="su-account-grid">
      <article class="su-account-item"><span>Conta conectada</span><strong id="su-account-email">—</strong></article>
      <article class="su-account-item"><span>Estado</span><strong id="su-account-state">Sincronizado</strong></article>
      <article class="su-account-item"><span>Última sincronização</span><strong id="su-account-last-sync">—</strong></article>
      <article class="su-account-item"><span>Último backup</span><strong id="su-account-last-backup">—</strong></article>
    </div>
    <label class="su-account-label">Nome deste dispositivo<input id="su-device-name" maxlength="60" placeholder="Ex.: iPad pessoal"></label>
    <div class="su-account-actions">
      <button id="su-save-device" class="primary" type="button">Salvar dispositivo</button>
      <button id="su-sync-now" type="button">Sincronizar agora</button>
      <button id="su-backup-now" type="button">Criar backup agora</button>
      <button id="su-restore-backup" type="button">Restaurar último backup</button>
      <button id="su-account-logout" class="danger" type="button">Sair da conta</button>
    </div>
    <p id="su-account-message" class="su-account-message" role="status"></p>
  </section>`;
  document.body.appendChild(overlay);

  document.getElementById("su-account-close").onclick = () => overlay.hidden = true;
  overlay.addEventListener("click", event => { if (event.target === overlay) overlay.hidden = true; });
  document.getElementById("su-save-device").onclick = saveDevice;
  document.getElementById("su-sync-now").onclick = syncNow;
  document.getElementById("su-backup-now").onclick = () => createBackup(false);
  document.getElementById("su-restore-backup").onclick = restoreBackup;
  document.getElementById("su-account-logout").onclick = () => signOut(auth);

  document.addEventListener("click", event => {
    const button = event.target.closest?.("#su-cloud-status");
    if (!button || !currentUser) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const oldGate = document.getElementById("su-cloud-gate");
    if (oldGate) oldGate.hidden = true;
    openPanel();
  }, true);
}

function message(text, error = false) {
  const element = document.getElementById("su-account-message");
  if (!element) return;
  element.textContent = text;
  element.style.color = error ? "#b42332" : "#12643f";
}

async function openPanel() {
  if (!currentUser) return;
  const overlay = document.getElementById("su-account-panel");
  overlay.hidden = false;
  document.getElementById("su-account-email").textContent = currentUser.email || "Usuário conectado";
  document.getElementById("su-device-name").value = localStorage.getItem(DEVICE_NAME_KEY) || "";
  document.getElementById("su-account-last-sync").textContent = formatDate(localStorage.getItem(LAST_SYNC_KEY));
  const badge = document.getElementById("su-cloud-status-text");
  document.getElementById("su-account-state").textContent = badge?.textContent || "Sincronizado";
  message("");
  try {
    const snapshot = await getDoc(doc(db, "users", currentUser.uid, "backups", "latest"));
    document.getElementById("su-account-last-backup").textContent = snapshot.exists() ? formatDate(snapshot.data().createdAt || snapshot.data().createdAtLocal) : "Nenhum backup";
  } catch (error) {
    document.getElementById("su-account-last-backup").textContent = "Não foi possível consultar";
  }
}

async function saveDevice() {
  if (!currentUser) return;
  const name = document.getElementById("su-device-name").value.trim() || "Dispositivo sem nome";
  localStorage.setItem(DEVICE_NAME_KEY, name);
  try {
    await setDoc(doc(db, "users", currentUser.uid, "devices", name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "device"), {
      name, app: "SU Mega", wallet: "C2", lastSeenAt: serverTimestamp(), userAgent: navigator.userAgent
    }, { merge: true });
    message("Nome do dispositivo salvo.");
  } catch (error) { message(`Falha ao salvar: ${error.code || error.message}`, true); }
}

async function syncNow() {
  if (!currentUser) return;
  message("Sincronizando…");
  const now = new Date().toISOString();
  localStorage.setItem(LAST_SYNC_KEY, now);
  try {
    await setDoc(doc(db, "users", currentUser.uid, "settings", "ecosystem"), {
      accountVersion: 1, modules: { suMega: true }, lastManualSyncAt: serverTimestamp(), deviceName: localStorage.getItem(DEVICE_NAME_KEY) || ""
    }, { merge: true });
    document.getElementById("su-account-last-sync").textContent = formatDate(now);
    message("Sincronização confirmada.");
    announce("SU Mega sincronizado");
  } catch (error) { message(`Falha na sincronização: ${error.code || error.message}`, true); }
}

async function createBackup(automatic) {
  if (!currentUser) return;
  message(automatic ? "Criando backup automático…" : "Criando backup…");
  const data = localSnapshot();
  const createdAtLocal = new Date().toISOString();
  try {
    await setDoc(doc(db, "users", currentUser.uid, "backups", "latest"), {
      app: "SU Mega", wallet: "C2", schema: 1, statuses: data.statuses, contests: data.contests,
      deviceName: localStorage.getItem(DEVICE_NAME_KEY) || "", createdAt: serverTimestamp(), createdAtLocal
    });
    localStorage.setItem("su-mega-last-auto-backup-v1", createdAtLocal);
    document.getElementById("su-account-last-backup").textContent = formatDate(createdAtLocal);
    message(automatic ? "Backup automático atualizado." : "Backup criado com sucesso.");
  } catch (error) { message(`Falha no backup: ${error.code || error.message}`, true); }
}

async function restoreBackup() {
  if (!currentUser || !confirm("Restaurar o último backup da nuvem? As marcações e concursos atuais serão substituídos.")) return;
  message("Restaurando backup…");
  try {
    const snapshot = await getDoc(doc(db, "users", currentUser.uid, "backups", "latest"));
    if (!snapshot.exists()) return message("Nenhum backup disponível.", true);
    const data = snapshot.data();
    const statusPayload = { app: "SU Mega", wallet: "C2", schema: 2, savedAt: new Date().toISOString(), statuses: data.statuses || {} };
    localStorage.setItem(STATUS_KEY, JSON.stringify(statusPayload));
    localStorage.setItem(CONTEST_KEY, JSON.stringify(Array.isArray(data.contests) ? data.contests : []));
    window.dispatchEvent(new StorageEvent("storage", { key: STATUS_KEY, newValue: JSON.stringify(statusPayload) }));
    globalThis.SUMegaContests?.importData?.(Array.isArray(data.contests) ? data.contests : [], true);
    message("Backup restaurado. A tela será atualizada.");
    setTimeout(() => location.reload(), 900);
  } catch (error) { message(`Falha ao restaurar: ${error.code || error.message}`, true); }
}

async function automaticBackupIfNeeded() {
  if (!currentUser) return;
  const last = new Date(localStorage.getItem("su-mega-last-auto-backup-v1") || 0).getTime();
  if (Date.now() - last > 24 * 60 * 60 * 1000) await createBackup(true);
}

injectPanel();
onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    setTimeout(automaticBackupIfNeeded, 2500);
  } else {
    const panel = document.getElementById("su-account-panel");
    if (panel) panel.hidden = true;
  }
});
