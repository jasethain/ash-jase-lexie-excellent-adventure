const CACHE_VERSION = 'ajl-offline-v10';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL).catch(()=>{})));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_VERSION).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Always fetch Vercel-built JS/CSS/HTML from network first so updates land quickly.
  if (request.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html')) {
    event.respondWith(fetch(request, { cache:'no-store' }).then(response => {
      const clone = response.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put(request, clone)).catch(()=>{});
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match('/index.html'))));
    return;
  }

  // Images/PDFs can fall back to cache if offline.
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    const clone = response.clone();
    caches.open(CACHE_VERSION).then(cache => cache.put(request, clone)).catch(()=>{});
    return response;
  })));
});
