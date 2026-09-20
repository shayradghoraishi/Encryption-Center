// Encryption Center service worker — offline caching of the app shell.
const CACHE = "enc-center-v1";

self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => caches.match("/"));
      return cached || fetchPromise;
    })
  );
});
