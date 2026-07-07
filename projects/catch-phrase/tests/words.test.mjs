import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, createDeck, loadWordLists } from '../js/words.js';

test('CATEGORIES lists Everything plus the five Ultimate categories in order, then the two adult categories', () => {
	assert.deepEqual(CATEGORIES.map((c) => c.name), [
		'Everything',
		'Around the World',
		'Fun and Games',
		'On the Air',
		'Snack Time',
		'The Great Outdoors',
		'After Dark',
		'Anything Goes',
	]);
});

test('deck draws every word once before any repeat', () => {
	const deck = createDeck(['a', 'b', 'c'], () => 0.5);
	const drawn = [deck.draw(), deck.draw(), deck.draw()];
	assert.deepEqual([...drawn].sort(), ['a', 'b', 'c']);
});

test('deck reshuffles and keeps drawing after exhaustion', () => {
	const deck = createDeck(['a', 'b'], () => 0.5);
	deck.draw();
	deck.draw();
	assert.ok(['a', 'b'].includes(deck.draw()));
});

test('loadWordLists returns lists, failures, and the everything union', async () => {
	const fetchFn = async (url) => {
		if (url.includes('snack-time')) return { ok: false, status: 404 };
		return { ok: true, json: async () => [url, `${url}-2`] };
	};
	const { lists, failures } = await loadWordLists(fetchFn);
	assert.deepEqual(failures, ['snack-time']);
	assert.equal(lists.get('everything').length, 8);
	assert.equal(lists.has('snack-time'), false);
});

test('everything excludes after-dark, anything-goes includes it', async () => {
	const fetchFn = async (url) => {
		if (url.includes('snack-time')) return { ok: false, status: 404 };
		return { ok: true, json: async () => [url, `${url}-2`] };
	};
	const { lists } = await loadWordLists(fetchFn);
	assert.equal(lists.get('anything-goes').length, 10);
	assert.equal(lists.get('everything').length, lists.get('anything-goes').length - 2);
});
