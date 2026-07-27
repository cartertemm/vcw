import test from "node:test";
import assert from "node:assert/strict";
import { parsePlayerNames, validateSetup } from "../validation.js";

test("parsePlayerNames trims lines and drops blank ones", () => {
	assert.deepEqual(
		parsePlayerNames("  Sarah \n\nMike\n   \nJo "),
		["Sarah", "Mike", "Jo"]
	);
});

test("validateSetup rejects fewer than 2 names", () => {
	const result = validateSetup("Sarah", "5");
	assert.equal(result.valid, false);
	assert.equal(result.error, "Enter at least 2 player names.");
});

test("validateSetup rejects duplicate names case-insensitively", () => {
	const result = validateSetup("Sarah\nsarah", "5");
	assert.equal(result.valid, false);
	assert.equal(result.error, "Player names must be unique.");
});

test("validateSetup checks name count before duplicates", () => {
	const result = validateSetup("Sarah", "5");
	assert.equal(result.error, "Enter at least 2 player names.");
});

test("validateSetup rejects a target score below 1", () => {
	for (const bad of ["0", "-3", "", "abc"]) {
		const result = validateSetup("Sarah\nMike", bad);
		assert.equal(result.valid, false);
		assert.equal(result.error, "Target score must be at least 1.");
	}
});

test("validateSetup checks names before target score", () => {
	const result = validateSetup("Sarah", "0");
	assert.equal(result.error, "Enter at least 2 player names.");
});

test("validateSetup accepts valid input", () => {
	const result = validateSetup("Sarah\nMike\nJo", "5");
	assert.deepEqual(result, {
		valid: true,
		names: ["Sarah", "Mike", "Jo"],
		targetScore: 5,
	});
});
