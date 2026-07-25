import { test } from "node:test";
import assert from "node:assert/strict";
import { applyAnswer, SURVIVAL_START_SECONDS, SURVIVAL_CORRECT_BONUS, SURVIVAL_WRONG_PENALTY } from "../modes/survival.js";

test("applyAnswer adds bonus time and a point on a correct answer", () => {
	const result = applyAnswer({ secondsLeft: 30, score: 0 }, true);
	assert.deepEqual(result, { secondsLeft: 30 + SURVIVAL_CORRECT_BONUS, score: 1 });
});

test("applyAnswer subtracts the penalty and does not add a point on a wrong answer", () => {
	const result = applyAnswer({ secondsLeft: 30, score: 5 }, false);
	assert.deepEqual(result, { secondsLeft: 30 - SURVIVAL_WRONG_PENALTY, score: 5 });
});

test("SURVIVAL_START_SECONDS matches the spec's 30 second round", () => {
	assert.equal(SURVIVAL_START_SECONDS, 30);
});
