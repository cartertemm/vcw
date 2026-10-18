import test from "node:test";
import assert from "node:assert/strict";
import { createBoard } from "../game.js";
import { boardView, fastMoneyRows } from "../spectator-view.js";
import { randomCode } from "../live.js";

const question = {
	question: "Name a pet.",
	answers: [{ text: "Dog", points: 50 }, { text: "Cat", points: 30 }, { text: "Fish", points: 10 }],
};

test("hidden answers never reach the spectator", () => {
	const board = createBoard(question);
	board.reveal(1);
	const view = boardView(board);
	assert.deepEqual(view, [null, { text: "Cat", points: 30, found: true }, null]);
	assert.doesNotMatch(JSON.stringify(view), /Dog|Fish|50|10/);
});

test("the end of a round shows every answer and which ones nobody found", () => {
	const board = createBoard(question);
	board.reveal(0);
	assert.deepEqual(boardView(board, true).map(a => a.found), [true, false, false]);
});

test("fast money rows stay hidden until they are revealed", () => {
	const fm = { questions: [question, question], picks: [[0, null], []] };
	assert.deepEqual(fastMoneyRows(fm, 0, 1), [{ text: "Dog", points: 50 }, null]);
	assert.deepEqual(fastMoneyRows(fm, 0, 2)[1], { text: "", points: 0 });
	assert.deepEqual(fastMoneyRows(fm, 1, 0), [null, null]);
});

test("room codes are four letters without look-alike letters", () => {
	for (let i = 0; i < 50; i++) assert.match(randomCode(), /^[A-HJ-NP-Z]{4}$/);
});
