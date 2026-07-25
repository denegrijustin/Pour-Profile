const CACHE_NAME = "elskatemm-trip-v128-footprint-style-load-retry";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/mobile-first-fix.css",
  "/app.js",
  "/trip-data.js",
  "/trip-stops.js",
  "/haunted-stops.js",
  "/emma-stops.js",
  "/katrina-stops.js",
  "/jules-stops.js",
  "/canada-wildfires.js",
  "/golden-egg.png",
  "/nasa-badge.png",
  "/momdad-gps-photo.png",
  "/italian-heritage-icon.png",
  "/national-park-icon.png",
  "/sasquatch-footprint.png",
  "/island-deco-icon.png",
  "/jules-gps.png",
  "/jules-gps-f1.png",
  "/family-gps-marker.png",
  "/eliette-gps-jeep.png",
  "/wildfire-marker.png",
  "/elsie-gps-photo.png",
  "/emma-gps-agent.png",
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
  const appShell = ["/", "/index.html"].includes(url.pathname);
  const staticAsset = ["/styles.css", "/mobile-first-fix.css", "/app.js", "/trip-data.js", "/trip-stops.js", "/haunted-stops.js", "/emma-stops.js", "/katrina-stops.js", "/jules-stops.js", "/jules-gps.png", "/jules-gps-f1.png", "/family-gps-marker.png", "/eliette-gps-jeep.png", "/elsie-gps-photo.png", "/emma-gps-agent.png", "/wildfire-marker.png", "/manifest.json", "/icon.svg"].includes(url.pathname);
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

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_TRIP_PACK") {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  }
});
