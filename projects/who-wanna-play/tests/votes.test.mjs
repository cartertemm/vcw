import test from "node:test";
import assert from "node:assert/strict";
import { VOTE_OPTIONS, applyVote } from "../votes.js";

test("VOTE_OPTIONS lists yes, no, and none in order", () => {
	assert.deepEqual(VOTE_OPTIONS.map(([value]) => value), ["yes", "no", "none"]);
});

test("applyVote sets and clears a vote without changing the input", () => {
	const start = { c1: "no" };
	assert.deepEqual(applyVote(start, "c2", "yes", true), { c1: "no", c2: "yes" });
	assert.deepEqual(applyVote(start, "c1", null, true), {});
	assert.deepEqual(start, { c1: "no" });
});

test("applyVote keeps many yes votes when multipleYes is on", () => {
	assert.deepEqual(applyVote({ c1: "yes" }, "c2", "yes", true), { c1: "yes", c2: "yes" });
});

test("applyVote keeps one yes vote when multipleYes is off", () => {
	assert.deepEqual(applyVote({ c1: "yes", c3: "no" }, "c2", "yes", false), { c2: "yes", c3: "no" });
});
