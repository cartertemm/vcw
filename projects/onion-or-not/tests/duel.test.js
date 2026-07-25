import { test } from "node:test";
import assert from "node:assert/strict";
import { isCorrectPick } from "../modes/duel.js";

test("isCorrectPick returns true when the picked headline is labeled real", () => {
	const pair = [{ text: "A", label: "real" }, { text: "B", label: "satire" }];
	assert.equal(isCorrectPick(pair, 0), true);
});

test("isCorrectPick returns false when the picked headline is labeled satire", () => {
	const pair = [{ text: "A", label: "real" }, { text: "B", label: "satire" }];
	assert.equal(isCorrectPick(pair, 1), false);
});
