/**
 * FinanceControl — Service Worker (PWA / Cache Offline Resiliente)
 * Compatível com Workbox e especificações PWA para cPanel / Apache / LiteSpeed.
 */

const CACHE_NAME = "financecontrol-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/robots.txt"
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Adiciona ativos principais tolerando eventuais omissões
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
// - API (/api/*): Network-first (não armazena dados financeiros obsoletos)
// - Assets estáticos (/assets/*): Cache-first com fallback para Network
// - Navegação SPA (HTML): Stale-While-Revalidate com fallback para /index.html
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
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // Navegação de páginas HTML no React SPA -> Serve index.html do cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Assets com hash (JS, CSS, Imagens, Fontes)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkRes) => {
          if (networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // Demais recursos: Network com fallback para Cache
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      })
      .catch(() => caches.match(req))
  );
});

