import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7fo20WlKpoySHDBdtjilOqVYRAI8OvKM",
  authDomain: "su-mega.firebaseapp.com",
  projectId: "su-mega",
  storageBucket: "su-mega.firebasestorage.app",
  messagingSenderId: "747588237835",
  appId: "1:747588237835:web:b5cc26c6971ca37cb3a50e"
};

const STATUS_KEY = "su-mega-c2-status-v1";
const CONTEST_KEY = "su-mega-c2-contests-v1";
const DEVICE_KEY = "su-mega-device-id-v1";
const VALID_STATUSES = new Set(["pendente", "registrado", "apostado"]);
const WATCHED_KEYS = new Set([STATUS_KEY, CONTEST_KEY]);
const APP_VERSION = "C2";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
let db;
try {
  db = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch {
  db = initializeFirestore(firebaseApp, {});
}

let currentUser = null;
let suppressLocalBridge = false;
let statusUnsubscribe = null;
let contestUnsubscribe = null;
let lastLocalStatuses = Object.create(null);
let remoteContestNumbers = new Set();
let initializedForUid = null;

const deviceId = (() => {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const created = globalThis.crypto?.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(DEVICE_KEY, created);
  return created;
})();

const nativeSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function patchedSetItem(key, value) {
  const oldValue = this.getItem(key);
  nativeSetItem.call(this, key, value);
  if (this === localStorage && WATCHED_KEYS.has(key) && !suppressLocalBridge && oldValue !== String(value)) {
    window.dispatchEvent(new CustomEvent("su-mega-local-storage-change", {
      detail: { key, oldValue, newValue: String(value) }
    }));
  }
};

function parseJson(value, fallback) {
  try { return JSON.parse(value ?? ""); } catch { return fallback; }
}

function normalizeStatuses(payload) {
  const source = payload && typeof payload === "object" && payload.statuses ? payload.statuses : payload;
  const result = Object.create(null);
  if (!source || typeof source !== "object") return result;
  for (const [id, status] of Object.entries(source)) {
    if (VALID_STATUSES.has(status)) result[id] = status;
  }
  return result;
}

function readLocalStatuses() {
  return normalizeStatuses(parseJson(localStorage.getItem(STATUS_KEY), {}));
}

function readLocalContests() {
  const value = parseJson(localStorage.getItem(CONTEST_KEY), []);
  return Array.isArray(value) ? value : [];
}

function stableContest(contest) {
  return JSON.stringify({
    number: Number(contest.number),
    date: String(contest.date || ""),
    numbers: Array.isArray(contest.numbers) ? contest.numbers.map(Number).sort((a, b) => a - b) : [],
    source: String(contest.source || ""),
    notes: String(contest.notes || ""),
    createdAt: String(contest.createdAt || ""),
    updatedAt: String(contest.updatedAt || "")
  });
}

function setCloudState(kind, message) {
  const badge = document.getElementById("su-cloud-status");
  const text = document.getElementById("su-cloud-status-text");
  if (badge) badge.dataset.state = kind;
  if (text) text.textContent = message;
}

function announce(message) {
  globalThis.SUMegaApp?.announce?.(message);
}

function injectUi() {
  if (document.getElementById("su-cloud-root")) return;
  const style = document.createElement("style");
  style.textContent = `
    #su-cloud-root{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:9998;font-family:inherit}
    .su-cloud-button{border:0;border-radius:999px;padding:11px 15px;background:#0d5f3d;color:#fff;font-weight:800;box-shadow:0 8px 28px #0003;display:flex;gap:8px;align-items:center}
    .su-cloud-dot{width:10px;height:10px;border-radius:50%;background:#fbbf24}.su-cloud-button[data-state="synced"] .su-cloud-dot{background:#4ade80}.su-cloud-button[data-state="saving"] .su-cloud-dot{background:#fbbf24}.su-cloud-button[data-state="offline"] .su-cloud-dot,.su-cloud-button[data-state="error"] .su-cloud-dot{background:#f87171}
    .su-cloud-gate{position:fixed;inset:0;z-index:10000;background:linear-gradient(145deg,#062f20f2,#0b1724f5);display:grid;place-items:center;padding:24px}.su-cloud-gate[hidden]{display:none}
    .su-cloud-card{width:min(430px,100%);background:#fff;border-radius:24px;padding:26px;box-shadow:0 24px 70px #0007;color:#17202a}.su-cloud-card h2{margin:0 0 8px}.su-cloud-card p{line-height:1.5;color:#53606d}.su-cloud-card label{display:grid;gap:7px;margin-top:15px;font-weight:700}.su-cloud-card input{font:inherit;padding:13px;border:1px solid #cbd5e1;border-radius:12px}.su-cloud-actions{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}.su-cloud-actions button{font:inherit;font-weight:800;border-radius:12px;border:1px solid #cbd5e1;padding:12px 15px}.su-cloud-actions .primary{background:#16834f;color:#fff;border-color:#16834f;flex:1}.su-cloud-error{color:#b91c1c!important;font-weight:700;min-height:1.4em}.su-cloud-user{margin-top:14px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:12px;align-items:center}.su-cloud-user[hidden]{display:none}
  `;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "su-cloud-root";
  root.innerHTML = `<button id="su-cloud-status" class="su-cloud-button" data-state="offline" type="button"><span class="su-cloud-dot"></span><span id="su-cloud-status-text">Nuvem desconectada</span></button>`;
  document.body.appendChild(root);

  const gate = document.createElement("div");
  gate.id = "su-cloud-gate";
  gate.className = "su-cloud-gate";
  gate.innerHTML = `<div class="su-cloud-card">
    <p style="margin:0;color:#16834f;font-weight:900">SU MEGA CLOUD</p>
    <h2>Entrar para sincronizar</h2>
    <p>Use o mesmo e-mail e senha no iPhone e no iPad. Os 705 jogos permanecem fixos; somente marcações e concursos são sincronizados.</p>
    <form id="su-cloud-login-form">
      <label>E-mail<input id="su-cloud-email" type="email" autocomplete="username" required></label>
      <label>Senha<input id="su-cloud-password" type="password" autocomplete="current-password" required></label>
      <p id="su-cloud-error" class="su-cloud-error" role="alert"></p>
      <div class="su-cloud-actions"><button class="primary" type="submit">Entrar</button></div>
    </form>
    <div id="su-cloud-user" class="su-cloud-user" hidden><span id="su-cloud-user-email"></span><button id="su-cloud-logout" type="button">Sair</button></div>
  </div>`;
  document.body.appendChild(gate);

  document.getElementById("su-cloud-status").addEventListener("click", () => {
    gate.hidden = false;
  });
  document.getElementById("su-cloud-login-form").addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.getElementById("su-cloud-email").value.trim();
    const password = document.getElementById("su-cloud-password").value;
    const error = document.getElementById("su-cloud-error");
    error.textContent = "";
    setCloudState("saving", "Entrando…");
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (reason) {
      console.error(reason);
      error.textContent = "Não foi possível entrar. Confira o e-mail, a senha e a conexão.";
      setCloudState("error", "Falha no login");
    }
  });
  document.getElementById("su-cloud-logout").addEventListener("click", () => signOut(auth));
  window.addEventListener("online", () => currentUser && setCloudState("saving", "Reconectando…"));
  window.addEventListener("offline", () => setCloudState("offline", "Offline • alterações em espera"));

  const footer = document.querySelector("footer p");
  if (footer) footer.textContent = "SU Mega – C2 • Sincronização privada entre dispositivos • Backup manual preservado.";
}

function setAuthUi(user) {
  const gate = document.getElementById("su-cloud-gate");
  const form = document.getElementById("su-cloud-login-form");
  const userBox = document.getElementById("su-cloud-user");
  const email = document.getElementById("su-cloud-user-email");
  if (!gate || !form || !userBox || !email) return;
  if (user) {
    gate.hidden = true;
    form.hidden = true;
    userBox.hidden = false;
    email.textContent = user.email || "Usuário conectado";
  } else {
    gate.hidden = false;
    form.hidden = false;
    userBox.hidden = true;
    email.textContent = "";
  }
}

function chunk(items, size = 400) {
  const groups = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}

async function writeStatusChanges(changes) {
  if (!currentUser || !changes.length) return;
  setCloudState(navigator.onLine ? "saving" : "offline", navigator.onLine ? "Salvando…" : "Offline • em espera");
  const base = collection(db, "users", currentUser.uid, "gameStatuses");
  for (const group of chunk(changes)) {
    const batch = writeBatch(db);
    for (const [id, status] of group) {
      batch.set(doc(base, id), { status, updatedAt: serverTimestamp(), deviceId, wallet: APP_VERSION }, { merge: true });
    }
    await batch.commit();
  }
}

async function syncLocalStatusPayload(raw) {
  const next = normalizeStatuses(parseJson(raw, {}));
  const changes = [];
  const ids = new Set([...Object.keys(lastLocalStatuses), ...Object.keys(next)]);
  for (const id of ids) {
    const status = next[id] || "pendente";
    if (lastLocalStatuses[id] !== status) changes.push([id, status]);
  }
  lastLocalStatuses = { ...next };
  if (changes.length) await writeStatusChanges(changes);
}

async function syncLocalContests(raw) {
  if (!currentUser) return;
  const contests = parseJson(raw, []);
  if (!Array.isArray(contests)) return;
  setCloudState(navigator.onLine ? "saving" : "offline", navigator.onLine ? "Salvando concursos…" : "Offline • em espera");
  const base = collection(db, "users", currentUser.uid, "contests");
  const localMap = new Map(contests.map(item => [String(Number(item.number)), item]));
  const operations = [];
  for (const [number, contest] of localMap) operations.push(["set", number, contest]);
  for (const number of remoteContestNumbers) if (!localMap.has(number)) operations.push(["delete", number, null]);
  for (const group of chunk(operations)) {
    const batch = writeBatch(db);
    for (const [action, number, contest] of group) {
      const ref = doc(base, number);
      if (action === "delete") batch.delete(ref);
      else batch.set(ref, { ...contest, number: Number(contest.number), updatedAtCloud: serverTimestamp(), deviceId, wallet: APP_VERSION }, { merge: true });
    }
    await batch.commit();
  }
}

function applyRemoteStatuses(snapshot) {
  const incoming = Object.create(null);
  snapshot.forEach(item => {
    const status = item.data()?.status;
    if (VALID_STATUSES.has(status)) incoming[item.id] = status;
  });
  const current = readLocalStatuses();
  const merged = { ...current, ...incoming };
  lastLocalStatuses = { ...merged };
  const payload = { app: "SU Mega", wallet: APP_VERSION, schema: 2, savedAt: new Date().toISOString(), statuses: merged };
  suppressLocalBridge = true;
  localStorage.setItem(STATUS_KEY, JSON.stringify(payload));
  suppressLocalBridge = false;
  window.dispatchEvent(new StorageEvent("storage", { key: STATUS_KEY, newValue: JSON.stringify(payload) }));
}

function applyRemoteContests(snapshot) {
  const contests = [];
  remoteContestNumbers = new Set();
  snapshot.forEach(item => {
    const data = item.data();
    remoteContestNumbers.add(item.id);
    contests.push({
      number: Number(data.number ?? item.id),
      date: String(data.date || ""),
      numbers: Array.isArray(data.numbers) ? data.numbers.map(Number).sort((a, b) => a - b) : [],
      source: String(data.source || ""),
      notes: String(data.notes || ""),
      createdAt: String(data.createdAt || ""),
      updatedAt: String(data.updatedAt || "")
    });
  });
  contests.sort((a, b) => b.number - a.number);
  const local = readLocalContests().sort((a, b) => b.number - a.number);
  if (JSON.stringify(local.map(stableContest)) === JSON.stringify(contests.map(stableContest))) return;
  suppressLocalBridge = true;
  const imported = globalThis.SUMegaContests?.importData?.(contests, true);
  if (!imported) localStorage.setItem(CONTEST_KEY, JSON.stringify(contests));
  suppressLocalBridge = false;
}

async function migrateIfNeeded(user) {
  const statusBase = collection(db, "users", user.uid, "gameStatuses");
  const contestBase = collection(db, "users", user.uid, "contests");
  const [remoteStatuses, remoteContests] = await Promise.all([getDocs(statusBase), getDocs(contestBase)]);

  const localStatuses = readLocalStatuses();
  lastLocalStatuses = { ...localStatuses };
  if (remoteStatuses.empty) {
    const nonDefault = Object.entries(localStatuses).filter(([, status]) => status !== "pendente");
    if (nonDefault.length) {
      await writeStatusChanges(nonDefault);
      announce(`${nonDefault.length} marcações locais enviadas para a nuvem`);
    }
  }

  const localContests = readLocalContests();
  remoteContestNumbers = new Set(remoteContests.docs.map(item => item.id));
  if (remoteContests.empty && localContests.length) {
    await syncLocalContests(JSON.stringify(localContests));
    announce(`${localContests.length} concursos locais enviados para a nuvem`);
  }
}

async function startCloud(user) {
  if (initializedForUid === user.uid) return;
  initializedForUid = user.uid;
  statusUnsubscribe?.();
  contestUnsubscribe?.();
  setCloudState("saving", "Preparando sincronização…");
  await migrateIfNeeded(user);

  statusUnsubscribe = onSnapshot(
    collection(db, "users", user.uid, "gameStatuses"),
    snapshot => {
      applyRemoteStatuses(snapshot);
      setCloudState(navigator.onLine ? "synced" : "offline", navigator.onLine ? "Sincronizado" : "Offline • cache ativo");
    },
    error => {
      console.error(error);
      setCloudState("error", "Erro de sincronização");
    }
  );

  contestUnsubscribe = onSnapshot(
    collection(db, "users", user.uid, "contests"),
    snapshot => {
      applyRemoteContests(snapshot);
      setCloudState(navigator.onLine ? "synced" : "offline", navigator.onLine ? "Sincronizado" : "Offline • cache ativo");
    },
    error => {
      console.error(error);
      setCloudState("error", "Erro nos concursos");
    }
  );
}

window.addEventListener("su-mega-local-storage-change", async event => {
  if (!currentUser || suppressLocalBridge) return;
  try {
    if (event.detail.key === STATUS_KEY) await syncLocalStatusPayload(event.detail.newValue);
    if (event.detail.key === CONTEST_KEY) await syncLocalContests(event.detail.newValue);
    setCloudState(navigator.onLine ? "synced" : "offline", navigator.onLine ? "Sincronizado" : "Offline • em espera");
  } catch (error) {
    console.error(error);
    setCloudState("error", "Falha ao salvar na nuvem");
  }
});

injectUi();
setCloudState("saving", "Verificando login…");

onAuthStateChanged(auth, async user => {
  currentUser = user;
  setAuthUi(user);
  if (!user) {
    initializedForUid = null;
    statusUnsubscribe?.();
    contestUnsubscribe?.();
    setCloudState("offline", "Entre para sincronizar");
    return;
  }
  try {
    await startCloud(user);
  } catch (error) {
    console.error(error);
    setCloudState("error", "Não foi possível iniciar a nuvem");
    const message = document.getElementById("su-cloud-error");
    if (message) message.textContent = "Falha ao acessar o banco. Confira as regras do Firestore e tente novamente.";
    document.getElementById("su-cloud-gate").hidden = false;
  }
});
