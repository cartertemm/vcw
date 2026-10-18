const CACHE_NAME = 'family-feud-v2';
const ASSETS = [
	'.',
	'index.html',
	'style.css',
	'dom-utils.js',
	'platform.js',
	'data.js',
	'game.js',
	'audio.js',
	'live.js',
	'spectator-view.js',
	'ui.js',
	'spectator.js',
	'index.js',
	'data/questions.json',
	'data/fast-money.json',
	'manifest.json',
	'assets/icon-180.png',
	'assets/icon-192.png',
	'assets/icon-512.png',
	'sounds/BELL.MAC%20%5B1%5D.wav',
	'sounds/BUZZER.MAC%20%5B1%5D.wav',
	'sounds/CLAPS1.SND%20%5B1%5D.wav',
	'sounds/DIDILIDI.MAC%20%5B1%5D.wav',
	'sounds/DING.MAC%20%5B1%5D.wav',
	'sounds/FEUDCLP1.wav',
	'sounds/FEUDCLP2.wav',
	'sounds/FEUDCLP3.wav',
	'sounds/FEUDCLP4.wav',
	'sounds/FEUDCLP5.wav',
	'sounds/FONEBUZZ.MAC%20%5B1%5D.wav',
	'sounds/LO_BUZZ.MAC%20%5B1%5D.wav',
	'sounds/SELECT.SND%20%5B1%5D.wav',
	'sounds/WIN_RIFF.SND.wav',
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
	if (event.request.method !== 'GET' || new URL(event.request.url).pathname.includes('/room/')) return;
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
