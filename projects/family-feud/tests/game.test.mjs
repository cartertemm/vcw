import test from "node:test";
import assert from "node:assert/strict";
import { multiplierForRound, faceOffWinner, createBoard, validateSetup } from "../game.js";

const question = {
	question: "Name a pet.",
	answers: [{ text: "Dog", points: 50 }, { text: "Cat", points: 30 }, { text: "Fish", points: 10 }],
};

test("multipliers are single, single, double, triple, then single", () => {
	assert.deepEqual([1, 2, 3, 4, 5, 9].map(multiplierForRound), [1, 1, 2, 3, 1, 1]);
});

test("face-off goes to the higher ranked answer", () => {
	assert.equal(faceOffWinner(0, null), "first");
	assert.equal(faceOffWinner(2, 1), "second");
	assert.equal(faceOffWinner(1, 2), "first");
	assert.equal(faceOffWinner(null, 2), "second");
	assert.equal(faceOffWinner(2, null), "first");
	assert.equal(faceOffWinner(null, null), null);
});

test("board banks revealed points and knows when it is cleared", () => {
	const board = createBoard(question);
	assert.equal(board.reveal(1), 30);
	assert.equal(board.isRevealed(1), true);
	assert.equal(board.isRevealed(0), false);
	assert.equal(board.bank(), 30);
	board.reveal(0);
	assert.equal(board.isCleared(), false);
	board.reveal(2);
	assert.equal(board.bank(), 90);
	assert.equal(board.isCleared(), true);
});

test("revealing the same answer twice does not double the bank", () => {
	const board = createBoard(question);
	board.reveal(0);
	board.reveal(0);
	assert.equal(board.bank(), 50);
});

test("validateSetup trims names and parses the target", () => {
	assert.deepEqual(validateSetup(" Smiths ", "Joneses", "300"), { valid: true, teams: ["Smiths", "Joneses"], target: 300 });
});

test("validateSetup rejects empty, duplicate names and bad targets", () => {
	assert.equal(validateSetup("", "Joneses", "300").valid, false);
	assert.equal(validateSetup("Smiths", "smiths", "300").valid, false);
	assert.equal(validateSetup("Smiths", "Joneses", "0").valid, false);
	assert.equal(validateSetup("Smiths", "Joneses", "2.5").valid, false);
});
