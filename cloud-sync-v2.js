import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, onSnapshot, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const config={apiKey:"AIzaSyB7fo20WlKpoySHDBdtjilOqVYRAI8OvKM",authDomain:"su-mega.firebaseapp.com",projectId:"su-mega",storageBucket:"su-mega.firebasestorage.app",messagingSenderId:"747588237835",appId:"1:747588237835:web:b5cc26c6971ca37cb3a50e"};
const app=initializeApp(config,"su-mega-cloud-v2");
const auth=getAuth(app);
const db=getFirestore(app);
const STATUS_KEY="su-mega-c2-status-v1";
const CONTEST_KEY="su-mega-c2-contests-v1";
const PENDING_KEY="su-mega-c2-sync-pending-v1";
const VALID=new Set(["pendente","registrado","apostado"]);
let user=null,stopStatus=null,stopContests=null,applying=false,startedUid=null,uploadTimer=null,resumeTimer=null;
let baselineStatuses={};

function parse(raw,fallback){try{return JSON.parse(raw??"")}catch{return fallback}}
function localStatuses(){const p=parse(localStorage.getItem(STATUS_KEY),{});const s=p?.statuses||p||{};const out={};for(const [id,v] of Object.entries(s))if(VALID.has(v))out[id]=v;return out}
function localContests(){const v=parse(localStorage.getItem(CONTEST_KEY),[]);return Array.isArray(v)?v:[]}
function pendingIds(){const value=parse(localStorage.getItem(PENDING_KEY),[]);return new Set(Array.isArray(value)?value.map(String):[])}
function savePending(set){localStorage.setItem(PENDING_KEY,JSON.stringify([...set]))}
function state(kind,text){const b=document.getElementById("su-cloud-status");const t=document.getElementById("su-cloud-status-text");if(b)b.dataset.state=kind;if(t)t.textContent=text}
function toast(text){globalThis.SUMegaApp?.announce?.(text)}
function sameStatuses(a,b){const keys=new Set([...Object.keys(a),...Object.keys(b)]);for(const key of keys)if((a[key]||"pendente")!==(b[key]||"pendente"))return false;return true}

function ui(){
 if(document.getElementById("su-cloud-root"))return;
 const style=document.createElement("style");style.textContent=`#su-cloud-root{position:fixed;right:14px;bottom:14px;z-index:9998}.su-cloud-button{border:0;border-radius:999px;padding:11px 15px;background:#0d5f3d;color:#fff;font-weight:800;box-shadow:0 8px 28px #0003}.su-cloud-gate{position:fixed;inset:0;z-index:10000;background:#062f20f2;display:grid;place-items:center;padding:24px}.su-cloud-gate[hidden]{display:none}.su-cloud-card{width:min(430px,100%);background:#fff;border-radius:24px;padding:26px;color:#17202a}.su-cloud-card label{display:grid;gap:7px;margin-top:15px;font-weight:700}.su-cloud-card input{font:inherit;padding:13px;border:1px solid #cbd5e1;border-radius:12px}.su-cloud-card button{font:inherit;font-weight:800;border-radius:12px;border:0;padding:12px 15px}.su-cloud-primary{background:#16834f;color:#fff;width:100%;margin-top:18px}.su-cloud-error{color:#b91c1c;font-weight:700}.su-cloud-user{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #ddd;margin-top:14px;padding-top:14px}.su-cloud-user[hidden]{display:none}`;document.head.appendChild(style);
 const root=document.createElement("div");root.id="su-cloud-root";root.innerHTML=`<button id="su-cloud-status" class="su-cloud-button" data-state="offline"><span id="su-cloud-status-text">Nuvem desconectada</span></button>`;document.body.appendChild(root);
 const gate=document.createElement("div");gate.id="su-cloud-gate";gate.className="su-cloud-gate";gate.innerHTML=`<div class="su-cloud-card"><p style="color:#16834f;font-weight:900;margin:0">SU MEGA CLOUD</p><h2>Entrar para sincronizar</h2><p>Use exatamente a mesma conta no Safari e no aplicativo instalado.</p><form id="su-cloud-login-form"><label>E-mail<input id="su-cloud-email" type="email" autocomplete="username" required></label><label>Senha<input id="su-cloud-password" type="password" autocomplete="current-password" required></label><p id="su-cloud-error" class="su-cloud-error"></p><button class="su-cloud-primary" type="submit">Entrar</button></form><div id="su-cloud-user" class="su-cloud-user" hidden><span id="su-cloud-user-email"></span><button id="su-cloud-logout">Sair</button></div></div>`;document.body.appendChild(gate);
 document.getElementById("su-cloud-status").onclick=()=>gate.hidden=false;
 document.getElementById("su-cloud-login-form").onsubmit=async e=>{e.preventDefault();const err=document.getElementById("su-cloud-error");err.textContent="";state("saving","Entrando…");try{await setPersistence(auth,browserLocalPersistence);await signInWithEmailAndPassword(auth,document.getElementById("su-cloud-email").value.trim(),document.getElementById("su-cloud-password").value)}catch(x){console.error(x);err.textContent=`Não foi possível entrar (${x.code||"erro"}).`;state("error","Falha no login")}};
 document.getElementById("su-cloud-logout").onclick=()=>signOut(auth);
 window.addEventListener("offline",()=>state("offline","Offline • alterações em espera"));
 window.addEventListener("online",()=>{if(user){state("saving","Reconectando…");resumeSync()}});
}
function authUi(u){const g=document.getElementById("su-cloud-gate"),f=document.getElementById("su-cloud-login-form"),box=document.getElementById("su-cloud-user"),mail=document.getElementById("su-cloud-user-email");if(u){g.hidden=true;f.hidden=true;box.hidden=false;mail.textContent=u.email||"Usuário conectado"}else{g.hidden=false;f.hidden=false;box.hidden=true;mail.textContent=""}}

function emitApplied(payload){
 try{window.dispatchEvent(new StorageEvent("storage",{key:STATUS_KEY,newValue:JSON.stringify(payload)}))}catch{}
 window.dispatchEvent(new CustomEvent("su:cloud-statuses-applied",{detail:payload.statuses}));
}

function applyStatuses(snap){
 const current=localStatuses();
 const pending=pendingIds();
 snap.forEach(d=>{const v=d.data()?.status;if(VALID.has(v)&&!pending.has(String(d.id)))current[d.id]=v});
 const payload={app:"SU Mega",wallet:"C2",schema:2,savedAt:new Date().toISOString(),statuses:current};
 applying=true;localStorage.setItem(STATUS_KEY,JSON.stringify(payload));applying=false;
 baselineStatuses={...current};
 emitApplied(payload);
}

function detectLocalChanges(next){
 const pending=pendingIds();
 const keys=new Set([...Object.keys(baselineStatuses),...Object.keys(next)]);
 for(const id of keys){const before=baselineStatuses[id]||"pendente";const after=next[id]||"pendente";if(before!==after)pending.add(String(id))}
 baselineStatuses={...next};
 savePending(pending);
 return pending.size;
}

async function uploadPendingStatuses(){
 if(!user)return;
 const pending=pendingIds();
 if(!pending.size){state("synced","Sincronizado");return}
 const current=localStatuses();
 const sent=new Map();
 state("saving",`Sincronizando ${pending.size} alteração${pending.size===1?"":"ões"}…`);
 const ids=[...pending];
 for(let i=0;i<ids.length;i+=400){const batch=writeBatch(db);for(const id of ids.slice(i,i+400)){const status=current[id]||"pendente";sent.set(id,status);batch.set(doc(db,"users",user.uid,"gameStatuses",id),{status,updatedAt:serverTimestamp(),wallet:"C2"},{merge:true})}await batch.commit()}
 const latest=localStatuses();
 const remaining=pendingIds();
 for(const [id,status] of sent)if((latest[id]||"pendente")===status)remaining.delete(id);
 savePending(remaining);
 baselineStatuses={...latest};
 state("synced",remaining.size?"Sincronização parcial":"Sincronizado");
}

function scheduleStatusUpload(){clearTimeout(uploadTimer);uploadTimer=setTimeout(()=>uploadPendingStatuses().catch(e=>{console.error(e);state("error","Falha ao salvar")}),260)}

async function uploadContests(contests){if(!user)return;for(let i=0;i<contests.length;i+=400){const batch=writeBatch(db);for(const c of contests.slice(i,i+400))batch.set(doc(db,"users",user.uid,"contests",String(Number(c.number))),{...c,number:Number(c.number),updatedAtCloud:serverTimestamp(),wallet:"C2"},{merge:true});await batch.commit()}}
function applyContests(snap){const list=[];snap.forEach(d=>{const x=d.data();list.push({number:Number(x.number??d.id),date:String(x.date||""),numbers:Array.isArray(x.numbers)?x.numbers.map(Number).sort((a,b)=>a-b):[],source:String(x.source||""),notes:String(x.notes||""),createdAt:String(x.createdAt||""),updatedAt:String(x.updatedAt||"")})});list.sort((a,b)=>b.number-a.number);applying=true;if(!globalThis.SUMegaContests?.importData?.(list,true))localStorage.setItem(CONTEST_KEY,JSON.stringify(list));applying=false}

const nativeSet=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){
 nativeSet.call(this,k,v);
 if(this!==localStorage||applying||!user)return;
 if(k===STATUS_KEY){if(detectLocalChanges(localStatuses()))scheduleStatusUpload()}
 if(k===CONTEST_KEY)uploadContests(localContests()).then(()=>state("synced","Sincronizado")).catch(e=>{console.error(e);state("error","Falha ao salvar concursos")});
};

async function pullStatuses(){if(!user)return;const snap=await getDocs(collection(db,"users",user.uid,"gameStatuses"));if(!snap.empty)applyStatuses(snap)}
async function resumeSync(){
 if(!user||document.hidden)return;
 clearTimeout(resumeTimer);
 resumeTimer=setTimeout(async()=>{try{await pullStatuses();await uploadPendingStatuses()}catch(e){console.error(e);state("error","Falha ao sincronizar")}},180);
}
function installResumeHooks(){window.addEventListener("pageshow",resumeSync);window.addEventListener("focus",resumeSync);document.addEventListener("visibilitychange",()=>{if(!document.hidden)resumeSync()})}

async function start(u){
 if(startedUid===u.uid){resumeSync();return}
 startedUid=u.uid;
 baselineStatuses=localStatuses();
 state("saving","Preparando sincronização…");
 const sr=collection(db,"users",u.uid,"gameStatuses"),cr=collection(db,"users",u.uid,"contests");
 const [rs,rc]=await Promise.all([getDocs(sr),getDocs(cr)]);
 if(rs.empty){const pending=pendingIds();for(const [id,status] of Object.entries(localStatuses()))if(status!=="pendente")pending.add(String(id));savePending(pending)}else applyStatuses(rs);
 if(rc.empty&&localContests().length)await uploadContests(localContests());
 await uploadPendingStatuses();
 stopStatus?.();stopContests?.();
 stopStatus=onSnapshot(sr,s=>{applyStatuses(s);state(navigator.onLine?"synced":"offline",navigator.onLine?"Sincronizado":"Offline • cache local")},e=>{console.error(e);state("error",`Erro status: ${e.code||""}`)});
 stopContests=onSnapshot(cr,s=>{applyContests(s);state(navigator.onLine?"synced":"offline",navigator.onLine?"Sincronizado":"Offline • cache local")},e=>{console.error(e);state("error",`Erro concursos: ${e.code||""}`)});
}

baselineStatuses=localStatuses();
ui();installResumeHooks();state("saving","Verificando login…");
onAuthStateChanged(auth,async u=>{user=u;authUi(u);if(!u){startedUid=null;stopStatus?.();stopContests?.();state("offline","Entre para sincronizar");return}try{await start(u);document.getElementById("su-cloud-gate").hidden=true}catch(e){console.error(e);state("error",`Erro: ${e.code||e.message||"nuvem"}`);const m=document.getElementById("su-cloud-error");if(m)m.textContent=`Falha ao acessar o Firestore: ${e.code||e.message||"erro desconhecido"}`;document.getElementById("su-cloud-gate").hidden=false}});
