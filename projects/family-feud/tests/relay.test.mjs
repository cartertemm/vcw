import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createRelay } from "../tools/relay.mjs";

async function startServer() {
	const relay = createRelay();
	const server = http.createServer((req, res) => {
		if (!relay(req, res)) {
			res.writeHead(404);
			res.end();
		}
	});
	await new Promise(resolve => server.listen(0, resolve));
	return { server, base: `http://localhost:${server.address().port}` };
}

function post(base, code, key, body) {
	return fetch(`${base}/room/${code}`, {
		method: "POST",
		headers: { "Content-Type": "application/json", "X-Host-Key": key },
		body: JSON.stringify(body),
	});
}

async function readEvents(base, code, count) {
	const controller = new AbortController();
	const res = await fetch(`${base}/room/${code}/events`, { signal: controller.signal });
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	const events = [];
	let text = "";
	return {
		async next() {
			while (events.length === 0) {
				const { value } = await reader.read();
				text += decoder.decode(value);
				const parts = text.split("\n\n");
				text = parts.pop();
				for (const part of parts) {
					if (part.startsWith("data: ")) events.push(JSON.parse(part.slice(6)));
				}
			}
			return events.shift();
		},
		close() {
			controller.abort();
		},
	};
}

test("unknown codes return 404", async () => {
	const { server, base } = await startServer();
	assert.equal((await fetch(`${base}/room/ZZZZ`)).status, 404);
	server.close();
});

test("only the host who claimed a code can post to it", async () => {
	const { server, base } = await startServer();
	assert.equal((await post(base, "ABCD", "host-key", { seq: 1, view: {}, sounds: [] })).status, 200);
	assert.equal((await post(base, "ABCD", "other-key", { seq: 2, view: {}, sounds: [] })).status, 403);
	assert.equal((await fetch(`${base}/room/ABCD`)).status, 200);
	server.close();
});

test("spectators get the latest view without old sounds, then live updates", async () => {
	const { server, base } = await startServer();
	await post(base, "ABCD", "k", { seq: 1, view: { screen: "round" }, sounds: ["intro"] });
	const stream = await readEvents(base, "ABCD");
	assert.deepEqual(await stream.next(), { seq: 1, view: { screen: "round" }, sounds: [] });
	const reply = await (await post(base, "ABCD", "k", { seq: 2, view: { screen: "board" }, sounds: ["reveal"] })).json();
	assert.equal(reply.spectators, 1);
	assert.deepEqual(await stream.next(), { seq: 2, view: { screen: "board" }, sounds: ["reveal"] });
	stream.close();
	server.close();
});

test("older updates are dropped", async () => {
	const { server, base } = await startServer();
	await post(base, "ABCD", "k", { seq: 5, view: { screen: "new" }, sounds: [] });
	await post(base, "ABCD", "k", { seq: 4, view: { screen: "old" }, sounds: [] });
	const stream = await readEvents(base, "ABCD");
	assert.equal((await stream.next()).view.screen, "new");
	stream.close();
	server.close();
});
