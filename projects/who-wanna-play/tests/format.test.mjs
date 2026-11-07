import test from "node:test";
import assert from "node:assert/strict";
import { PRIVACY_LINE, bulkAddedText, countdownText, nextSort, resultRows, rulesText, sortMessage, sortRows } from "../format.js";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

test("countdownText shows the two largest units", () => {
	assert.equal(countdownText(0), "Results any second now");
	assert.equal(countdownText(-5000), "Results any second now");
	assert.equal(countdownText(SECOND), "Results in 1 second");
	assert.equal(countdownText(1500), "Results in 2 seconds");
	assert.equal(countdownText(MINUTE + SECOND), "Results in 1 minute, 1 second");
	assert.equal(countdownText(2 * HOUR + 5 * MINUTE + 30 * SECOND), "Results in 2 hours, 5 minutes");
	assert.equal(countdownText(DAY + 5 * MINUTE), "Results in 1 day");
	assert.equal(countdownText(3 * DAY + 4 * HOUR), "Results in 3 days, 4 hours");
});

const CHOICES = [
	{ id: "c1", name: "Pool" },
	{ id: "c2", name: "bowling" },
	{ id: "c3", name: "Darts" },
];
const RESULTS = {
	c1: { yes: 2, no: 1, none: 0 },
	c2: { yes: 2, no: 0, none: 1 },
};

test("resultRows adds a score and zeros for missing totals", () => {
	assert.deepEqual(resultRows(CHOICES, RESULTS), [
		{ id: "c1", name: "Pool", yes: 2, no: 1, none: 0, score: 1 },
		{ id: "c2", name: "bowling", yes: 2, no: 0, none: 1, score: 2 },
		{ id: "c3", name: "Darts", yes: 0, no: 0, none: 0, score: 0 },
	]);
});

test("sortRows keeps added order with no sort and keeps ties stable", () => {
	const rows = resultRows(CHOICES, RESULTS);
	const ids = (sorted) => sorted.map((row) => row.id);
	assert.deepEqual(ids(sortRows(rows, null)), ["c1", "c2", "c3"]);
	assert.deepEqual(ids(sortRows(rows, { key: "yes", direction: "descending" })), ["c1", "c2", "c3"]);
	assert.deepEqual(ids(sortRows(rows, { key: "yes", direction: "ascending" })), ["c3", "c1", "c2"]);
	assert.deepEqual(ids(sortRows(rows, { key: "score", direction: "descending" })), ["c2", "c1", "c3"]);
	assert.deepEqual(ids(sortRows(rows, { key: "name", direction: "ascending" })), ["c2", "c3", "c1"]);
	assert.deepEqual(ids(rows), ["c1", "c2", "c3"]);
});

test("nextSort starts names A to Z, numbers highest first, and flips on repeat", () => {
	assert.deepEqual(nextSort(null, "name"), { key: "name", direction: "ascending" });
	assert.deepEqual(nextSort(null, "yes"), { key: "yes", direction: "descending" });
	assert.deepEqual(nextSort({ key: "yes", direction: "descending" }, "yes"), { key: "yes", direction: "ascending" });
	assert.deepEqual(nextSort({ key: "yes", direction: "ascending" }, "no"), { key: "no", direction: "descending" });
});

test("sortMessage describes the sort in words", () => {
	assert.equal(sortMessage({ key: "yes", direction: "descending" }), "Sorted by Yes, highest first.");
	assert.equal(sortMessage({ key: "none", direction: "ascending" }), "Sorted by No preference, lowest first.");
	assert.equal(sortMessage({ key: "name", direction: "ascending" }), "Sorted by Choice, A to Z.");
	assert.equal(sortMessage({ key: "name", direction: "descending" }), "Sorted by Choice, Z to A.");
});

test("rulesText describes the settings", () => {
	const open = rulesText({ multipleYes: true, revealAt: null, listed: true });
	assert.ok(open.includes("You can vote Yes on as many choices as you like."));
	assert.ok(open.includes("Results show right away and update live."));
	assert.ok(open.includes("This activity is on the main page."));
	assert.ok(open.includes(PRIVACY_LINE));
	const strict = rulesText({ multipleYes: false, revealAt: "2030-01-01T00:00:00.000Z", listed: false });
	assert.ok(strict.includes("You can vote Yes on only one choice. A new Yes replaces your old one."));
	assert.ok(strict.some((line) => line.startsWith("Results show on ")));
	assert.ok(strict.includes("Only people with the link can find this activity."));
});

test("bulkAddedText describes what was added and skipped", () => {
	assert.equal(bulkAddedText(1, 0), "Added 1 choice.");
	assert.equal(bulkAddedText(5, 0), "Added 5 choices.");
	assert.equal(bulkAddedText(3, 1), "Added 3 choices. Skipped 1 duplicate.");
	assert.equal(bulkAddedText(0, 2), "No new choices. Skipped 2 duplicates.");
});
