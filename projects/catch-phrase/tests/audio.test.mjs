import test from 'node:test';
import assert from 'node:assert/strict';
import { planRound, MIN_ROUND_MS, MAX_ROUND_MS } from '../js/audio.js';

test('round length spans 45 to 75 seconds based on rng', () => {
	assert.equal(planRound(() => 0).totalMs, MIN_ROUND_MS);
	assert.ok(planRound(() => 0.9999).totalMs < MAX_ROUND_MS);
	assert.equal(MIN_ROUND_MS, 45000);
	assert.equal(MAX_ROUND_MS, 75000);
});

test('three equal phases with strictly accelerating beeps', () => {
	const plan = planRound(() => 0);
	assert.equal(plan.phases.length, 3);
	assert.equal(plan.phases[0].untilMs, 15000);
	assert.equal(plan.phases[1].untilMs, 30000);
	assert.equal(plan.phases[2].untilMs, 45000);
	assert.ok(plan.phases[0].intervalMs > plan.phases[1].intervalMs);
	assert.ok(plan.phases[1].intervalMs > plan.phases[2].intervalMs);
});
