const CACHE_NAME = "su-mega-c2-beta-v18";
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
  "./cloud-sync-v2.js",
  "./account-panel.js",
  "./ecosystem-ui.js",
  "./prize-analysis.js",
  "./contest-bets.js",
  "./contest-bets-cloud.js",
  "./contest-lock.js",
  "./beta-banner.js",
  "./beta-layout-review.js",
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
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith("su-mega-") && key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

async function officialResultsWithCloud(request) {
  const cache = await caches.open(CACHE_NAME);
  let response;
  try {
    response = await fetch(request, { cache: "no-store" });
    if (response.ok) await cache.put(request, response.clone());
  } catch {
    response = await cache.match(request);
  }

  const loader = "\n;import('./beta-banner.js?v=18')"
    + ".then(()=>import('./beta-layout-review.js?v=10'))"
    + ".then(()=>import('./cloud-sync-v2.js?v=3'))"
    + ".then(()=>import('./account-panel.js'))"
    + ".then(()=>import('./ecosystem-ui.js?v=7'))"
    + ".then(()=>import('./prize-analysis.js?v=2'))"
    + ".then(()=>import('./contest-bets.js?v=3'))"
    + ".then(()=>import('./contest-bets-cloud.js?v=3'))"
    + ".then(()=>import('./contest-lock.js?v=1'))"
    + ".catch(error=>console.error('SU Mega Beta:',error));\n";

  if (!response) {
    return new Response(loader, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }

  return new Response((await response.text()) + loader, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin && url.pathname.endsWith("/official-results.js")) {
    event.respondWith(officialResultsWithCloud(event.request));
    return;
  }

  if (
    url.pathname.endsWith("/ecosystem-ui.js") ||
    url.pathname.endsWith("/prize-analysis.js") ||
    url.pathname.endsWith("/contest-bets.js") ||
    url.pathname.endsWith("/contest-bets-cloud.js") ||
    url.pathname.endsWith("/contest-lock.js") ||
    url.pathname.endsWith("/beta-banner.js") ||
    url.pathname.endsWith("/beta-layout-review.js") ||
    url.pathname.endsWith("/cloud-sync-v2.js")
  ) {
    event.respondWith(fetch(event.request, { cache: "no-store" }).catch(() => caches.match(event.request)));
    return;
  }

  if (
    url.pathname.endsWith("/data/ultimo-concurso.json") ||
    url.pathname.endsWith("/data/concursos-oficiais.json")
  ) {
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
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
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