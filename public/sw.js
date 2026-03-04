const CACHE_NAME = 'magnavita-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Magnavita Serviços Marítimos';
    const options = {
        body: data.body || 'Você tem uma nova notificação.',
        icon: '/pwa-icon-192.png',
        badge: '/pwa-icon-192.png',
        data: data.url || '/',
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data || '/')
    );
});
