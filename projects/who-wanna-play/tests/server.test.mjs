import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAppServer } from "../app-server.mjs";

async function start(t) {
	const dataDir = await mkdtemp(join(tmpdir(), "wwp-server-"));
	const server = await createAppServer({ dataDir });
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	t.after(async () => {
		await new Promise((resolve) => server.close(resolve));
		await rm(dataDir, { recursive: true, force: true });
	});
	const base = `http://127.0.0.1:${server.address().port}`;
	async function call(method, path, body) {
		const response = await fetch(base + path, {
			method,
			headers: body === undefined ? {} : { "Content-Type": "application/json" },
			body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
		});
		return { status: response.status, body: await response.json() };
	}
	function rawGet(path) {
		return new Promise((resolve, reject) => {
			http.get({ host: "127.0.0.1", port: server.address().port, path }, (response) => {
				const chunks = [];
				response.on("data", (chunk) => chunks.push(chunk));
				response.on("end", () => resolve({ status: response.statusCode, body: Buffer.concat(chunks) }));
			}).on("error", reject);
		});
	}
	return { call, rawGet, dataDir };
}

const ACTIVITY = { name: "Movie night", voter: "Sam" };

test("create, list, and read an activity", async (t) => {
	const { call } = await start(t);
	assert.deepEqual(await call("POST", "/api/activities", ACTIVITY), { status: 201, body: { slug: "movie-night" } });
	await call("POST", "/api/activities", { name: "Hidden", voter: "Sam", listed: false });
	const list = await call("GET", "/api/activities");
	assert.deepEqual(list.body, [{ slug: "movie-night", name: "Movie night", description: "" }]);
	const view = await call("GET", "/api/activities/movie-night");
	assert.equal(view.status, 200);
	assert.equal(view.body.name, "Movie night");
	assert.deepEqual(view.body.results, {});
	assert.ok(!("votes" in view.body));
});

test("add choices and vote", async (t) => {
	const { call } = await start(t);
	await call("POST", "/api/activities", ACTIVITY);
	const choice = await call("POST", "/api/activities/movie-night/choices", { name: "Mortal Kombat", voter: "Jo" });
	assert.deepEqual(choice, { status: 201, body: { id: "c1", name: "Mortal Kombat", description: "" } });
	const vote = await call("PUT", "/api/activities/movie-night/votes", { voter: "Jo", choiceId: "c1", value: "yes" });
	assert.deepEqual(vote, { status: 200, body: { myVotes: { c1: "yes" } } });
	const view = await call("GET", "/api/activities/movie-night?voter=JO");
	assert.deepEqual(view.body.myVotes, { c1: "yes" });
	assert.deepEqual(view.body.results, { c1: { yes: 1, no: 0, none: 0 } });
});

test("results are hidden before the reveal time", async (t) => {
	const { call } = await start(t);
	await call("POST", "/api/activities", { ...ACTIVITY, revealAt: "2999-01-01T00:00:00.000Z" });
	assert.equal((await call("GET", "/api/activities/movie-night")).body.results, null);
});

test("errors return plain messages", async (t) => {
	const { call } = await start(t);
	assert.deepEqual(await call("GET", "/api/activities/nope"), { status: 404, body: { error: "Activity not found." } });
	assert.equal((await call("POST", "/api/activities", { name: "No voter" })).status, 400);
	assert.equal((await call("POST", "/api/activities", "{not json")).status, 400);
	assert.equal((await call("POST", "/api/activities", "[]")).status, 400);
	assert.equal((await call("DELETE", "/api/activities")).status, 404);
	assert.equal((await call("GET", "/api/other")).status, 404);
	assert.equal((await call("GET", "/api/activities/a/b/c")).status, 404);
	await call("POST", "/api/activities", { ...ACTIVITY, slug: "x" });
	assert.equal((await call("POST", "/api/activities", { ...ACTIVITY, slug: "x" })).status, 409);
	assert.equal((await call("POST", "/api/activities", { ...ACTIVITY, description: "x".repeat(11 * 1024) })).status, 413);
});

test("the data file never holds names in readable form", async (t) => {
	const { call, dataDir } = await start(t);
	await call("POST", "/api/activities", ACTIVITY);
	await call("POST", "/api/activities/movie-night/choices", { name: "A", voter: "Zelda" });
	await call("PUT", "/api/activities/movie-night/votes", { voter: "Zelda", choiceId: "c1", value: "no" });
	const raw = (await readFile(join(dataDir, "data.enc"))).toString("latin1");
	assert.ok(!raw.includes("Zelda"));
	assert.ok(!raw.includes("Movie night"));
});

test("the key and data can never be downloaded", async (t) => {
	const { call, rawGet, dataDir } = await start(t);
	await call("POST", "/api/activities", ACTIVITY);
	const key = await readFile(join(dataDir, "secret.key"));
	const data = await readFile(join(dataDir, "data.enc"));
	const paths = [
		"/secret.key",
		"/data/secret.key",
		"/data.enc",
		"/data/data.enc",
		"/../",
		"/%2e%2e/",
		"/..%2fdata%2fsecret.key",
		"/../data/secret.key",
		"/%2e%2e/%2e%2e/data/secret.key",
		"/api/../data/secret.key",
		"/server.mjs",
		"/vault.mjs",
		"/package.json",
	];
	for (const path of paths) {
		const response = await rawGet(path);
		assert.ok(!response.body.includes(key), `key leaked at ${path}`);
		assert.ok(!response.body.includes(key.toString("hex")), `key hex leaked at ${path}`);
		assert.ok(!response.body.includes(key.toString("base64")), `key base64 leaked at ${path}`);
		assert.ok(!response.body.includes(data), `data leaked at ${path}`);
		assert.ok(!response.body.toString().includes("createCipheriv"), `source leaked at ${path}`);
	}
});
