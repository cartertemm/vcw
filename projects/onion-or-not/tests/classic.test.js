import { test } from "node:test";
import assert from "node:assert/strict";
import { updateTally } from "../modes/classic.js";

test("updateTally increments total every time and correct only when the guess was right", () => {
	let tally = { correct: 0, total: 0 };
	tally = updateTally(tally, true);
	assert.deepEqual(tally, { correct: 1, total: 1 });
	tally = updateTally(tally, false);
	assert.deepEqual(tally, { correct: 1, total: 2 });
});

test("updateTally does not mutate the tally it was given", () => {
	const original = { correct: 0, total: 0 };
	updateTally(original, true);
	assert.deepEqual(original, { correct: 0, total: 0 });
});
