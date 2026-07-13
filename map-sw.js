const CACHE_NAME = 'map-tile-cache-v1';
const MAP_DOMAINS = ['basemaps.cartocdn.com', 'tile.openstreetmap.org'];

self.addEventListener('install', (event) => {
    // Activate worker immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Take control of all pages immediately
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Check if the request is for a map tile
    const isMapTile = MAP_DOMAINS.some(domain => url.hostname.includes(domain));

    if (isMapTile && event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // Return cached tile if found
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetch(event.request).then((networkResponse) => {
                    // Only cache valid responses
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                        return networkResponse;
                    }

                    // Clone the response because it's a stream and can only be consumed once
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }).catch(() => {
                    // If network fails and not in cache, just return a broken image or handle gracefully
                    // Leaflet usually handles broken images itself if we just return nothing
                });
            })
        );
    }
});
