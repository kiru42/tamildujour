// Service worker de Tamil du jour : rend l'app utilisable hors ligne une fois
// chargée. Toute la progression vit sur l'appareil ; il suffit donc de garder
// la page et ses ressources. Seules les requêtes GET du même site vers la
// page d'accueil, les fichiers de APP_SHELL et /_next/static sont traitées :
// aucune requête vers un service tiers ni aucune donnée ne passe par ici.

const CACHE = "tamildujour-v1";

const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

const STATIC_PREFIX = "/_next/static/";

function staticUrlsIn(text, baseUrl) {
  const urls = new Set();
  const pattern = /(?:src|href)="([^"]+)"|url\(\s*["']?([^"')]+)["']?\s*\)/g;
  for (const match of text.matchAll(pattern)) {
    const url = new URL(match[1] || match[2], baseUrl);
    if (url.origin === self.location.origin && url.pathname.startsWith(STATIC_PREFIX)) {
      urls.add(url.href);
    }
  }
  return [...urls];
}

async function cacheIfMissing(cache, url) {
  if (await cache.match(url)) return;
  const response = await fetch(url);
  if (response.ok) await cache.put(url, response);
}

// Met en cache la page, puis les scripts, styles et polices qu'elle charge
// (y compris les polices déclarées dans les feuilles de style).
async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(APP_SHELL);

  const page = await cache.match("/");
  const assets = staticUrlsIn(await page.text(), self.location.origin);
  await Promise.all(assets.map((url) => cacheIfMissing(cache, url)));

  const stylesheets = assets.filter((url) => new URL(url).pathname.endsWith(".css"));
  for (const url of stylesheets) {
    const stylesheet = await cache.match(url);
    if (!stylesheet) continue;
    const fonts = staticUrlsIn(await stylesheet.text(), url);
    await Promise.all(fonts.map((font) => cacheIfMissing(cache, font)));
  }
}

async function removeOldCaches() {
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
}

// Page : réseau d'abord (dernière version), cache si hors ligne. Seule la
// page d'accueil est enregistrée.
async function networkFirstPage(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    const isHome = new URL(request.url).pathname === "/";
    if (isHome && response.ok) await cache.put("/", response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match("/");
    if (cached) return cached;
    throw error;
  }
}

// Ressources versionnées (/_next/static) : cache d'abord, elles ne changent pas.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

// Manifeste et icônes : réseau d'abord, cache si hors ligne.
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(removeOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
  } else if (url.pathname.startsWith(STATIC_PREFIX)) {
    event.respondWith(cacheFirst(request));
  } else if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(networkFirst(request));
  }
});
