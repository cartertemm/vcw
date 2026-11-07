import test from "node:test";
import assert from "node:assert/strict";
import { PRIVACY_LINE, countdownText, rulesText, tallyText } from "../format.js";

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

test("tallyText lists every option, with zeros for missing totals", () => {
	assert.equal(tallyText({ yes: 4, no: 1, none: 2 }), "Yes 4, No 1, No preference 2");
	assert.equal(tallyText(undefined), "Yes 0, No 0, No preference 0");
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
