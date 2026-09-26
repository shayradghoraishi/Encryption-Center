const CACHE = "enc-center-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    try {
      const response = await fetch(req);
      if (response.ok && response.type === "basic") cache.put(req, response.clone());
      return response;
    } catch {
      if (cached) return cached;
      if (req.mode === "navigate") {
        const scopeUrl = new URL("./", self.registration.scope);
        return (await cache.match(scopeUrl.toString())) || Response.error();
      }
      return Response.error();
    }
  })());
});
