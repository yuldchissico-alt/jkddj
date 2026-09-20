const CACHE_NAME = 'logpose-v3';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/pwa-192.png',
  '/icons/pwa-512.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignora erros individuais de cache
      });
    })
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first para APIs, cache-first para assets estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições de extensão, scripts do navegador e outros esquemas sem suporte
  if (!['http:', 'https:'].includes(url.protocol)) return;

  // Ignora requisições não-GET e APIs do backend
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // Assets estáticos: cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|css|js|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navegação (HTML): network-first, fallback para cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/') || caches.match('/dashboard');
      })
    );
  }
});

// Push notifications: receber notificação de venda
self.addEventListener('push', (event) => {
  let title = 'Nexuscale 🎉';
  let options = {
    body: 'Nova venda realizada!',
    icon: '/icons/pwa-192.png',
    badge: '/icons/pwa-192.png',
    vibrate: [200, 100, 200],
    tag: 'sale-notification',
    requireInteraction: false,
    data: {
      url: '/sales'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      
      // Se o payload já tem title e body direto
      if (payload.title) {
        title = payload.title;
      }
      if (payload.body) {
        options.body = payload.body;
      }
      if (payload.data) {
        options.data = { ...options.data, ...payload.data };
      }
    } catch (e) {
      // Se não for JSON, usar como texto simples
      options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click: abrir app na página de vendas
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/sales';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma janela aberta, focar nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // Senão, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
