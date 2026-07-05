import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, WIN_SCORE } from '../js/game.js';

function harness() {
	const log = { words: [], announced: [], scores: [], fanfare: 0, starts: 0, stops: 0 };
	let onExpire = null;
	let counter = 0;
	const game = createGame({
		categories: ['Everything', 'Around the World'],
		drawWord: () => `word-${++counter}`,
		timer: {
			start(cb) {
				log.starts++;
				onExpire = cb;
			},
			stop() {
				log.stops++;
			},
		},
		display: (text) => log.words.push(text),
		announce: (text) => log.announced.push(text),
		updateScores: (a, b) => log.scores.push([a, b]),
		playFanfare: () => log.fanfare++,
	});
	return { game, log, expire: () => onExpire() };
}

test('timer press from idle starts a round and shows a word', () => {
	const { game, log } = harness();
	game.pressTimer();
	assert.equal(game.state, 'round');
	assert.deepEqual(log.words, ['word-1']);
	assert.equal(log.starts, 1);
});

test('next advances the word during a round and does nothing otherwise', () => {
	const { game, log } = harness();
	game.pressNext();
	assert.deepEqual(log.words, []);
	game.pressTimer();
	game.pressNext();
	assert.deepEqual(log.words, ['word-1', 'word-2']);
});

test('expiry ends the round and shows Time\'s up on the display only', () => {
	const { game, log, expire } = harness();
	game.pressTimer();
	expire();
	assert.equal(game.state, 'ended');
	assert.equal(log.words.at(-1), "Time's up");
	assert.deepEqual(log.announced, []);
});

test('timer press mid-round stops the round', () => {
	const { game, log } = harness();
	game.pressTimer();
	game.pressTimer();
	assert.equal(game.state, 'ended');
	assert.equal(log.stops, 1);
	assert.equal(log.words.at(-1), 'Stopped');
});

test('timer press from ended starts the next round directly', () => {
	const { game, log, expire } = harness();
	game.pressTimer();
	expire();
	game.pressTimer();
	assert.equal(game.state, 'round');
	assert.equal(log.starts, 2);
});

test('team press adds a point and announces the score', () => {
	const { game, log } = harness();
	game.pressTeam(0);
	game.pressTeam(1);
	game.pressTeam(1);
	assert.deepEqual(log.scores, [[1, 0], [1, 1], [1, 2]]);
	assert.deepEqual(log.announced, ['Team 1: 1', 'Team 2: 1', 'Team 2: 2']);
});

test('reaching WIN_SCORE triggers the win sequence', () => {
	const { game, log } = harness();
	for (let i = 0; i < WIN_SCORE; i++) game.pressTeam(0);
	assert.equal(game.state, 'win');
	assert.equal(log.fanfare, 1);
	assert.equal(log.words.at(-1), 'Team 1 wins!');
	assert.equal(log.announced.filter((t) => t.includes('wins')).length, 0);
});

test('winning mid-round stops the timer', () => {
	const { game, log } = harness();
	for (let i = 0; i < WIN_SCORE - 1; i++) game.pressTeam(0);
	game.pressTimer();
	game.pressTeam(0);
	assert.equal(game.state, 'win');
	assert.equal(log.stops, 1);
});

test('team presses are ignored in the win state', () => {
	const { game, log } = harness();
	for (let i = 0; i < WIN_SCORE; i++) game.pressTeam(0);
	const scoreUpdates = log.scores.length;
	game.pressTeam(1);
	assert.equal(log.scores.length, scoreUpdates);
});

test('timer press after a win resets scores and starts round one immediately', () => {
	const { game, log } = harness();
	for (let i = 0; i < WIN_SCORE; i++) game.pressTeam(0);
	game.pressTimer();
	assert.equal(game.state, 'round');
	assert.deepEqual(log.scores.at(-1), [0, 0]);
	assert.equal(log.starts, 1);
});

test('category cycles with wraparound and announces, but is locked during a round', () => {
	const { game, log } = harness();
	game.pressCategory();
	assert.equal(game.categoryIndex, 1);
	assert.deepEqual(log.announced, ['Around the World']);
	game.pressCategory();
	assert.equal(game.categoryIndex, 0);
	game.pressTimer();
	game.pressCategory();
	assert.equal(game.categoryIndex, 0);
});
