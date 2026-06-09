const CACHE = 'excellent-adventure-v2';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/assets/Qantas_E_Ticket_DQ3AT8.pdf', '/assets/Tokyo_Meeting_Point.jpg'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/')))));
