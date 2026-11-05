self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => { if (event.data?.type === 'SHOW_NOTIFICATION') self.registration.showNotification(event.data.title || 'MindForge reminder', { body: event.data.body || 'Time for your planned activity.', icon: '/icon.svg', badge: '/icon.svg', tag: event.data.tag || 'mindforge-reminder' }); });
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list => list.length ? list[0].focus() : clients.openWindow('/'))); });
