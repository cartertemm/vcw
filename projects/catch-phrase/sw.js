const CACHE_NAME = 'catch-phrase-v4';
const ASSETS = [
	'.',
	'index.html',
	'css/style.css',
	'js/platform.js',
	'js/words.js',
	'js/game.js',
	'js/audio.js',
	'js/main.js',
	'data/around-the-world.json',
	'data/fun-and-games.json',
	'data/on-the-air.json',
	'data/snack-time.json',
	'data/the-great-outdoors.json',
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
