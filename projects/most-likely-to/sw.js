const CACHE_NAME = 'most-likely-to-v1';
const ASSETS = [
	'.',
	'index.html',
	'style.css',
	'dom-utils.js',
	'platform.js',
	'validation.js',
	'scoring.js',
	'data.js',
	'index.js',
	'data/sfw.json',
	'data/nsfw.json',
	'manifest.json',
	'assets/icon-180.png',
	'assets/icon-192.png',
	'assets/icon-512.png',
];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				const copy = response.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
				return response;
			})
			.catch(() => caches.match(event.request))
	);
});
