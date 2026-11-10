/**
 * FinanceControl — Service Worker (PWA / Cache Offline Resiliente v2)
 * Compatível com Workbox e especificações PWA para cPanel / Apache / LiteSpeed.
 */

const CACHE_NAME = "financecontrol-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/robots.txt",
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch {
          // Ignora se algum recurso individual não estiver disponível no escopo atual
        }
      }
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Estratégia de requisições:
// - API (/api/*): Network-first
// - Navegação SPA (HTML): Network com fallback resiliente para /index.html
// - Assets estáticos (/assets/*): Cache-first com fallback para Network
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Não intercepta chamadas não GET ou para outros domínios
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Endpoints da API Laravel não devem ser cacheados pelo Service Worker
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(JSON.stringify({ error: "Offline mode", fallback: true }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Navegação de páginas HTML no React SPA -> Serve index.html (nunca resolve undefined)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cached = (await caches.match("/index.html")) || (await caches.match("/"));
        if (cached) return cached;

        try {
          const fresh = await fetch("/index.html");
          if (fresh && fresh.status === 200) return fresh;
        } catch {}

        return new Response(
          "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='utf-8'><title>FinanceControl</title><meta http-equiv='refresh' content='1'></head><body><p style='font-family:sans-serif;padding:2rem;'>Carregando sistema...</p></body></html>",
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      })
    );
    return;
  }

  // Assets com hash (JS, CSS, Imagens, Fontes)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((networkRes) => {
            if (networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkRes;
          })
          .catch(() => new Response("", { status: 404, statusText: "Asset Not Found" }));
      })
    );
    return;
  }

  // Demais recursos: Network com fallback para Cache (sempre retornando uma Response válida)
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response("", { status: 408, statusText: "Offline / Timeout" });
      })
  );
});
