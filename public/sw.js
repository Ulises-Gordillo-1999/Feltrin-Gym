// Service Worker - Centro de Entrenamiento Feltrin PWA
const CACHE_NAME = 'feltrin-gym-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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

// Network-First con fallback a cache para navegación y estáticos
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar API y Server Actions del cache
  if (url.pathname.startsWith('/api') || event.request.headers.get('next-action')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.match(/\.(svg|png|jpg|webp|css|woff2)$/) || url.pathname === '/')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si es navegación HTML y estamos offline
        if (event.request.mode === 'navigate') {
          return new Response(
            `<!DOCTYPE html>
            <html lang="es" class="h-full bg-zinc-950 text-zinc-100">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Sin Conexión | Feltrin Gym</title>
              <style>
                body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; text-align: center; }
                .card { max-width: 400px; padding: 32px; border-radius: 24px; background: #18181b; border: 1px solid #27272a; }
                h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #10b981; }
                p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px; }
                button { background: #059669; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Feltrin Gym • Modo Sin Conexión</h1>
                <p>No se pudo conectar con el servidor. Verificá tu conexión a internet o datos móviles para continuar entrenando o gestionando.</p>
                <button onclick="window.location.reload()">Reintentar Conexión</button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});

// Receptor de Notificaciones Push para avisos de profesores/administradores
self.addEventListener('push', (event) => {
  let data = {
    title: 'Feltrin Gym',
    body: 'Tenés un nuevo aviso en el gimnasio.',
    url: '/',
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

