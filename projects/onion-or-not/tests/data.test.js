import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHeadlines } from "../data.js";

test("parseHeadlines trims lines and tags each with the given label", () => {
	const raw = "First headline\nSecond headline\n";
	const result = parseHeadlines(raw, "real");
	assert.deepEqual(result, [
		{ text: "First headline", label: "real" },
		{ text: "Second headline", label: "real" }
	]);
});

test("parseHeadlines drops blank and whitespace-only lines", () => {
	const raw = "One\n\n   \nTwo\n";
	const result = parseHeadlines(raw, "satire");
	assert.equal(result.length, 2);
	assert.deepEqual(result.map(h => h.text), ["One", "Two"]);
});

test("parseHeadlines drops headlines over 200 characters", () => {
	const long = "x".repeat(201);
	const raw = `Short one\n${long}\n`;
	const result = parseHeadlines(raw, "real");
	assert.equal(result.length, 1);
	assert.equal(result[0].text, "Short one");
});

test("parseHeadlines keeps a headline exactly at the 200 character limit", () => {
	const exact = "x".repeat(200);
	const result = parseHeadlines(`${exact}\n`, "real");
	assert.equal(result.length, 1);
});

import { makeDeck } from "../data.js";

test("makeDeck.nextPair always returns one real and one satire headline", () => {
	const real = [{ text: "R1", label: "real" }];
	const satire = [{ text: "S1", label: "satire" }];
	const deck = makeDeck(real, satire, () => 0);
	const [a, b] = deck.nextPair();
	assert.deepEqual([a.label, b.label].sort(), ["real", "satire"]);
});

test("makeDeck.nextEither draws from the real pool when randomFn is below 0.5", () => {
	const real = [{ text: "R1", label: "real" }];
	const satire = [{ text: "S1", label: "satire" }];
	const deck = makeDeck(real, satire, () => 0);
	assert.equal(deck.nextEither().label, "real");
});

test("makeDeck recycles a pool once exhausted", () => {
	const real = [{ text: "R1", label: "real" }];
	const satire = [{ text: "S1", label: "satire" }];
	const deck = makeDeck(real, satire, () => 0); // always < 0.5 -> always draws "real"
	const first = deck.nextEither();
	const second = deck.nextEither();
	assert.equal(first.text, "R1");
	assert.equal(second.text, "R1");
});
