const CACHE_NAME = "beatfield-attendance-cache-v9";
const ENABLE_ASSET_CACHE = false;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./design.css",
  "./app.js",
  "./push-reminders.js",
  "./wix-integration.js",
  "./config.js",
  "./manifest.webmanifest",
  "./beatfield-logo.png",
];

self.addEventListener("install", (event) => {
  if (ENABLE_ASSET_CACHE) event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith('beatfield-attendance-cache-') && (!ENABLE_ASSET_CACHE || key !== CACHE_NAME))
        .map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (!ENABLE_ASSET_CACHE || new URL(event.request.url).pathname.includes('/api/')) return;
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isAppShellAsset = isSameOrigin && (
    requestUrl.pathname.endsWith(".html")
    || requestUrl.pathname.endsWith(".css")
    || requestUrl.pathname.endsWith(".js")
    || requestUrl.pathname === "/"
    || requestUrl.pathname.endsWith("/index.html")
  );

  if (isAppShellAsset) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch { /* Visible fallback. */ }
  const base = new URL('./', self.registration.scope);
  let target = base.href;
  try {
    const url = new URL(payload.url, base);
    if (url.origin === base.origin && url.pathname === base.pathname) target = url.href;
  } catch { /* Do not open arbitrary URLs. */ }
  event.waitUntil(self.registration.showNotification(
    typeof payload.title === 'string' ? payload.title.slice(0, 100) : 'BEATFIELD · Erinnerung', {
      body: typeof payload.body === 'string' ? payload.body.slice(0, 250) : 'Bitte prüfe deine Anwesenheiten in der App.',
      icon: new URL('beatfield-logo.png', base).href,
      tag: typeof payload.tag === 'string' ? payload.tag.slice(0, 100) : 'beatfield-reminder',
      data: { url: target },
    },
  ));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const base = new URL('./', self.registration.scope);
  let target = base.href;
  try {
    const url = new URL(event.notification.data?.url || base.href, base);
    if (url.origin === base.origin && url.pathname === base.pathname) target = url.href;
  } catch { /* Fall back to the app. */ }
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === base.origin && new URL(client.url).pathname.startsWith(base.pathname));
    if (existing && 'navigate' in existing) {
      const navigated = await existing.navigate(target);
      if (navigated) { await navigated.focus(); return; }
    }
    await self.clients.openWindow(target);
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const freshResponse = await fetch(request, { cache: "no-store" });
    if (freshResponse && freshResponse.status === 200) {
      cache.put(request, freshResponse.clone());
    }
    return freshResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return caches.match("./index.html");
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return caches.match("./index.html");
  }
}
