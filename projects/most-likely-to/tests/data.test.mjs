import test from "node:test";
import assert from "node:assert/strict";
import { shuffle, createPromptPool, loadPrompts } from "../data.js";

test("shuffle returns the same elements in some order", () => {
	const result = shuffle(["a", "b", "c"], () => 0.5);
	assert.deepEqual([...result].sort(), ["a", "b", "c"]);
});

test("createPromptPool draws every prompt once before repeating", () => {
	const pool = createPromptPool(["a", "b", "c"], () => 0.5);
	const drawn = [pool.next(), pool.next(), pool.next()];
	assert.deepEqual([...drawn].sort(), ["a", "b", "c"]);
});

test("createPromptPool reshuffles and keeps drawing after exhaustion", () => {
	const pool = createPromptPool(["a", "b"], () => 0.5);
	pool.next();
	pool.next();
	assert.ok(["a", "b"].includes(pool.next()));
});

test("loadPrompts returns sfw, nsfw, and their concatenation as anythingGoes", async () => {
	const fetchFn = async (url) => {
		if (url === "data/sfw.json") return { ok: true, json: async () => ["s1", "s2"] };
		if (url === "data/nsfw.json") return { ok: true, json: async () => ["n1"] };
		throw new Error(`unexpected url: ${url}`);
	};
	const { sfw, nsfw, anythingGoes } = await loadPrompts(fetchFn);
	assert.deepEqual(sfw, ["s1", "s2"]);
	assert.deepEqual(nsfw, ["n1"]);
	assert.deepEqual(anythingGoes, ["s1", "s2", "n1"]);
});

test("loadPrompts throws if either fetch fails", async () => {
	const fetchFn = async (url) => ({ ok: url !== "data/nsfw.json", json: async () => [] });
	await assert.rejects(() => loadPrompts(fetchFn));
});
