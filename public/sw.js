/* Cyenoo PWA — network-first for pages, cache only static icons */
const CACHE = "cyenoo-static-v3";
const PRECACHE = ["/manifest.webmanifest", "/icon-192", "/icon"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = req.mode === "navigate" || req.destination === "document";
  const isAuthPath =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/admin") ||
    url.pathname === "/";

  if (isNavigation || isAuthPath) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response("<!doctype html><title>Cyenoo</title><body>Hors ligne</body>", {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      )
    );
    return;
  }

  if (
    url.pathname === "/icon" ||
    url.pathname === "/icon-192" ||
    url.pathname === "/apple-icon" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const clone = res.clone();
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
            return res;
          })
      )
    );
    return;
  }

  event.respondWith(fetch(req));
});
