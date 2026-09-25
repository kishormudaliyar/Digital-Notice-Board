/**
 * Digital Notice Board - Service Worker
 * Implements standard PWA caching strategies:
 * 1. Pre-caching App Shell (Install & Activate lifecycle)
 * 2. Network-First with Cache Fallback for HTML Navigation
 * 3. Stale-While-Revalidate for Static Assets (CSS, JS, Icons, Manifest)
 * 4. Web Push Notification and Notification Click Handlers
 */

const CACHE_NAME = 'notice-board-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon-192.svg',
    './icon-512.svg'
];

// 1. INSTALL EVENT - Pre-cache Application Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-caching application shell');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// 2. ACTIVATE EVENT - Clean up obsolete cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => {
                        if (name !== CACHE_NAME) {
                            console.log('[Service Worker] Removing deprecated cache:', name);
                            return caches.delete(name);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Claiming clients for immediate control');
                return self.clients.claim();
            })
    );
});

// 3. FETCH EVENT - Standard Caching Strategies
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Strategy A: Network-First for Navigation (HTML document requests)
    // Always attempt fresh network fetch so users receive new notices, falling back to cached shell offline
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    console.log('[Service Worker] Network unavailable. Serving cached index.html');
                    return caches.match('./index.html').then((cached) => {
                        return cached || caches.match('./');
                    });
                })
        );
        return;
    }

    // Strategy B: Stale-While-Revalidate for Static Assets (CSS, JS, Manifest, SVG/Images)
    // Instant load from cache with non-blocking background revalidation
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                const networkFetch = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Offline network failure for static asset is handled gracefully by cache
                        return null;
                    });

                return cachedResponse || networkFetch;
            })
    );
});

// 4. PUSH EVENT - Handle web push notifications
self.addEventListener('push', (event) => {
    let payload = {
        title: 'Digital Notice Board',
        body: 'New announcement published on notice board.',
        icon: './icon-192.svg',
        badge: './icon-192.svg'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            payload.title = data.title || payload.title;
            payload.body = data.body || data.content || payload.body;
        } catch (e) {
            payload.body = event.data.text() || payload.body;
        }
    }

    const options = {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now()
        }
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

// 5. NOTIFICATION CLICK - Focus existing tab or open new window
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('./index.html');
                }
            })
    );
});
