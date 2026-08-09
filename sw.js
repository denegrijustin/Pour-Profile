const CACHE_NAME = "pour-profile-v8-category-profiles";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/api.js",
  "/ui.js",
  "/spirit-taxonomy.js",
  "/log-pour.js",
  "/view-home.js",
  "/view-spirits.js",
  "/view-scan.js",
  "/view-discover.js",
  "/view-map.js",
  "/view-profile.js",
  "/view-bottle.js",
  "/view-compare.js",
  "/view-wine-palate.js",
  "/wine-engine.js",
  "/wine-form.js",
  "/rating-sources.js",
  "/brand-hero.jpg",
  "/brand-ambient.jpg",
  "/manifest.json",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // API reads/writes always hit the network; api.js handles offline fallback itself.

  const appShell = ["/", "/index.html"].includes(url.pathname);
  const staticAsset = CORE_ASSETS.includes(url.pathname);

  if (appShell) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }
  if (staticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const update = fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        }).catch(() => cached);
        return cached || update;
      })
    );
  }
});
