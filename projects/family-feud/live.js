const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 4;
const HEARTBEAT_MS = 3000;

export function randomCode(randomFn = Math.random) {
	return Array.from({ length: CODE_LENGTH }, () => CODE_LETTERS[Math.floor(randomFn() * CODE_LETTERS.length)]).join("");
}

// Sends the host's spectator view to the relay in tools/serve.mjs. On a host
// without the relay, `available` stays false and nothing else happens.
export function createLiveLink(fetchFn = fetch) {
	const code = randomCode();
	const key = crypto.randomUUID();
	let seq = 0;
	let view = { screen: "lobby" };
	let sounds = [];
	let spectators = 0;
	let available = false;
	let scheduled = false;

	async function send() {
		scheduled = false;
		const body = JSON.stringify({ seq: ++seq, view, sounds });
		sounds = [];
		try {
			const res = await fetchFn(`room/${code}`, {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Host-Key": key },
				body,
			});
			if (!res.ok) return false;
			spectators = (await res.json()).spectators;
			return true;
		} catch {
			return false;
		}
	}

	function schedule() {
		if (!available || scheduled) return;
		scheduled = true;
		queueMicrotask(send);
	}

	return {
		code,
		get available() {
			return available;
		},
		get hasSpectators() {
			return available && spectators > 0;
		},
		async start() {
			available = await send();
			if (available) setInterval(send, HEARTBEAT_MS);
		},
		setView(next) {
			view = next;
			schedule();
		},
		playSound(name) {
			sounds.push(name);
			schedule();
		},
	};
}
