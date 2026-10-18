const ROOM_PATH = /^\/room\/([A-Z]{4})(\/events)?$/;
const MAX_BODY_BYTES = 100000;
const KEEPALIVE_MS = 20000;

function sendJson(res, status, body) {
	res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
	res.end(JSON.stringify(body));
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		let body = '';
		req.on('data', (chunk) => {
			body += chunk;
			if (body.length > MAX_BODY_BYTES) {
				reject(new Error('too large'));
				req.destroy();
			}
		});
		req.on('end', () => resolve(body));
		req.on('error', reject);
	});
}

// Passes game updates from a host to its spectators. The first host to post
// to a room code claims it with a key, so other people can't take it over.
export function createRelay() {
	const rooms = new Map();

	setInterval(() => {
		for (const room of rooms.values()) {
			for (const client of room.clients) client.write(': ping\n\n');
		}
	}, KEEPALIVE_MS).unref();

	async function post(req, res, code) {
		const key = req.headers['x-host-key'];
		let room = rooms.get(code);
		if (room && room.key !== key) return sendJson(res, 403, { error: 'wrong key' });
		let message;
		try {
			message = JSON.parse(await readBody(req));
		} catch {
			return sendJson(res, 400, { error: 'bad body' });
		}
		if (!room) {
			room = { key, seq: -1, latest: null, clients: new Set() };
			rooms.set(code, room);
		}
		if (message.seq > room.seq) {
			room.seq = message.seq;
			room.latest = { ...message, sounds: [] };
			const data = `data: ${JSON.stringify(message)}\n\n`;
			for (const client of room.clients) client.write(data);
		}
		sendJson(res, 200, { spectators: room.clients.size });
	}

	function subscribe(req, res, room) {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-store',
			Connection: 'keep-alive',
		});
		res.write('retry: 2000\n\n');
		if (room.latest) res.write(`data: ${JSON.stringify(room.latest)}\n\n`);
		room.clients.add(res);
		req.on('close', () => room.clients.delete(res));
	}

	return function handle(req, res) {
		const match = ROOM_PATH.exec(req.url.split('?')[0]);
		if (!match) return false;
		const [, code, events] = match;
		const room = rooms.get(code);
		if (req.method === 'POST' && !events) {
			post(req, res, code);
		} else if (req.method === 'GET' && !room) {
			sendJson(res, 404, { error: 'no game with that code' });
		} else if (req.method === 'GET' && events) {
			subscribe(req, res, room);
		} else if (req.method === 'GET') {
			sendJson(res, 200, { ok: true });
		} else {
			sendJson(res, 405, { error: 'method not allowed' });
		}
		return true;
	};
}
