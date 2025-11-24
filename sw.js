// Service Worker для Discord Clone

const CACHE_NAME = 'discord-clone-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    'https://via.placeholder.com/40',
    'https://via.placeholder.com/100'
];

// Установка Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache.filter(url => url.startsWith('/')));
            })
            .catch(err => console.log('Cache failed:', err))
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    // Пропускаем запросы, которые не являются GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        // Не кешируем некорректные ответы
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Клонируем ответ
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Возвращаем кешированный ответ, если сеть недоступна
                        return caches.match(event.request);
                    });
            })
    );
});

// Удаление старых кешей
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
