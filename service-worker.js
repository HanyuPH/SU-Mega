const CACHE_NAME = "su-mega-c2-cloud-v2";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./contests.css",
  "./core.js",
  "./contest-core.js",
  "./contests.js",
  "./app.js",
  "./official-results.js",
  "./cloud-sync.js",
  "./data/games-01.js",
  "./data/games-02.js",
  "./data/games-03.js",
  "./data/games-04.js",
  "./data/games-05.js",
  "./data/games-06.js",
  "./data/games-07.js",
  "./data/games-08.js",
  "./data/games-09.js",
  "./data/games-10.js",
  "./data/ultimo-concurso.json",
  "./data/concursos-oficiais.json",
  "./manifest.json",
  "./assets/icons/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key.startsWith("su-mega-") && key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function injectCloudModule(html) {
  if (html.includes("cloud-sync.js")) return html;
  return html.replace("</body>", "  <script type=\"module\" src=\"./cloud-sync.js?v=2\"></script>\n</body>");
}

async function navigationWithCloud(request) {
  const cache = await caches.open(CACHE_NAME);
  let response;
  try {
    response = await fetch(request, { cache: "no-store" });
    if (response.ok) await cache.put("./index.html", response.clone());
  } catch {
    response = await cache.match("./index.html");
  }
  if (!response) return new Response("Aplicativo indisponível", { status: 503 });
  const html = injectCloudModule(await response.text());
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
  });
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.pathname.endsWith("/data/ultimo-concurso.json") || url.pathname.endsWith("/data/concursos-oficiais.json")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(navigationWithCloud(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.status === 200 && url.origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
