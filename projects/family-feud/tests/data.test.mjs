import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cleanQuestions, createPool, loadQuestions } from "../data.js";

test("cleanQuestions drops unscored answers and sorts by points", () => {
	const cleaned = cleanQuestions([
		{ question: "Q1", answers: [{ text: "B", points: 10 }, { text: "X", points: null }, { text: "A", points: 40 }] },
		{ question: "Q2", answers: [{ text: "X", points: null }] },
	]);
	assert.deepEqual(cleaned, [{ question: "Q1", answers: [{ text: "A", points: 40 }, { text: "B", points: 10 }] }]);
});

test("createPool hands out every item before repeating", () => {
	const pool = createPool([1, 2, 3]);
	const firstPass = [pool.next(), pool.next(), pool.next()].sort();
	assert.deepEqual(firstPass, [1, 2, 3]);
	assert.ok([1, 2, 3].includes(pool.next()));
});

test("loadQuestions reads both pools from the real data files", async () => {
	const fakeFetch = async path => {
		const text = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
		return { ok: true, json: async () => JSON.parse(text) };
	};
	const { main, fastMoney } = await loadQuestions(fakeFetch);
	assert.ok(main.length > 3000);
	assert.ok(fastMoney.length > 1000);
	for (const q of [...main, ...fastMoney]) {
		assert.ok(q.answers.length > 0);
		assert.ok(q.answers.every(a => a.points > 0));
	}
});
