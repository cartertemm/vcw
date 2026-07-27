import test from "node:test";
import assert from "node:assert/strict";
import { createScoreboard } from "../scoring.js";

test("addPoint increments only the named player", () => {
	const board = createScoreboard(["Sarah", "Mike"]);
	board.addPoint("Sarah");
	assert.equal(board.getScore("Sarah"), 1);
	assert.equal(board.getScore("Mike"), 0);
});

test("getWinner returns null before anyone reaches the target", () => {
	const board = createScoreboard(["Sarah", "Mike"]);
	board.addPoint("Sarah");
	assert.equal(board.getWinner(2), null);
});

test("getWinner returns the player who reached the target", () => {
	const board = createScoreboard(["Sarah", "Mike"]);
	board.addPoint("Sarah");
	board.addPoint("Sarah");
	assert.equal(board.getWinner(2), "Sarah");
});

test("sortedEntries sorts descending by score, ties keep input order", () => {
	const board = createScoreboard(["Sarah", "Mike", "Jo"]);
	board.addPoint("Jo");
	board.addPoint("Jo");
	board.addPoint("Sarah");
	assert.deepEqual(board.sortedEntries(), [
		{ name: "Jo", score: 2 },
		{ name: "Sarah", score: 1 },
		{ name: "Mike", score: 0 },
	]);
});

test("sortedEntries keeps setup order for players tied at the same score", () => {
	const board = createScoreboard(["Sarah", "Mike", "Jo"]);
	assert.deepEqual(board.sortedEntries(), [
		{ name: "Sarah", score: 0 },
		{ name: "Mike", score: 0 },
		{ name: "Jo", score: 0 },
	]);
});
