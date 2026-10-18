import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../index.js", import.meta.url), "utf8");

test("main menu offers instructions", () => {
	assert.match(source, /data-action="instructions">Instructions<\/button>/);
	assert.match(source, /on\("instructions", renderInstructions\)/);
});

test("game text does not separate sighted and blind players", async () => {
	const page = await readFile(new URL("../index.html", import.meta.url), "utf8");
	for (const text of [source, page]) {
		assert.doesNotMatch(text, /screen ?reader|sighted|blind|earbud|voiceover|talkback/i);
	}
});

test("instructions explain the full game in plain language", () => {
	for (const text of [
		"Read these rules out loud before you start",
		"Face-off",
		"Playing a round",
		"Three strikes and stealing",
		"Scoring and winning",
		"Fast Money",
		"Do not use phones, the internet, or other hints",
		"Families may talk together only when they get a chance to steal",
	]) {
		assert.match(source, new RegExp(text));
	}
});

test("instructions let the host return or start a game", () => {
	assert.match(source, /data-action="back">Back to the main menu<\/button>/);
	assert.match(source, /data-action="start">Start a new game<\/button>/);
	assert.match(source, /on\("back", renderMenu\)/);
	assert.match(source, /on\("start", \(\) => renderSetup\(\)\)/);
});
