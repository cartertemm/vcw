import test from "node:test";
import assert from "node:assert/strict";
import {
	StoreError,
	addChoice,
	addChoices,
	createActivity,
	emptyState,
	getActivity,
	listActivities,
	publicView,
	setVote,
	slugify,
	tally,
	voterCode,
} from "../store.mjs";

const SECRET = Buffer.alloc(32, 7);

function rejects(fn, status) {
	assert.throws(fn, (error) => error instanceof StoreError && error.status === status);
}

function makeActivity(state, extra = {}) {
	return createActivity(state, { name: "Movie night", voter: "Sam", ...extra });
}

test("slugify makes a clean slug or falls back to activity", () => {
	assert.equal(slugify("  Movie Night!! 2 "), "movie-night-2");
	assert.equal(slugify("!!!"), "activity");
	assert.equal(slugify("a".repeat(60)).length, 40);
});

test("createActivity fills defaults and makes a slug from the name", () => {
	const state = emptyState();
	const activity = makeActivity(state, { description: " Pick one " });
	assert.equal(activity.slug, "movie-night");
	assert.equal(activity.description, "Pick one");
	assert.equal(activity.listed, true);
	assert.equal(activity.multipleYes, true);
	assert.equal(activity.revealAt, null);
	assert.deepEqual(activity.choices, []);
	assert.deepEqual(activity.votes, {});
	assert.ok(!("voter" in activity));
});

test("createActivity adds a number when the slug is taken", () => {
	const state = emptyState();
	makeActivity(state);
	assert.equal(makeActivity(state).slug, "movie-night-2");
	assert.equal(makeActivity(state).slug, "movie-night-3");
});

test("createActivity never uses a reserved slug from the name", () => {
	const state = emptyState();
	assert.equal(createActivity(state, { name: "New", voter: "Sam" }).slug, "new-2");
	assert.equal(createActivity(state, { name: "API", voter: "Sam" }).slug, "api-2");
});

test("createActivity checks a typed slug", () => {
	const state = emptyState();
	assert.equal(makeActivity(state, { slug: "Friday" }).slug, "friday");
	rejects(() => makeActivity(state, { slug: "friday" }), 409);
	rejects(() => makeActivity(state, { slug: "new" }), 409);
	rejects(() => makeActivity(state, { slug: "bad slug" }), 400);
	rejects(() => makeActivity(state, { slug: "a--b" }), 400);
	rejects(() => makeActivity(state, { slug: "constructor" }), 409);
});

test("createActivity requires a voter name and an activity name", () => {
	const state = emptyState();
	rejects(() => createActivity(state, { name: "Movie night" }), 400);
	rejects(() => createActivity(state, { name: "  ", voter: "Sam" }), 400);
	rejects(() => createActivity(state, { name: "x".repeat(81), voter: "Sam" }), 400);
	rejects(() => makeActivity(state, { description: "x".repeat(501) }), 400);
});

test("createActivity stores settings and a valid reveal time", () => {
	const state = emptyState();
	const activity = makeActivity(state, { listed: false, multipleYes: false, revealAt: "2030-01-01T10:00:00.000Z" });
	assert.equal(activity.listed, false);
	assert.equal(activity.multipleYes, false);
	assert.equal(activity.revealAt, "2030-01-01T10:00:00.000Z");
	rejects(() => makeActivity(state, { revealAt: "soon" }), 400);
});

test("getActivity throws 404 for missing and inherited names", () => {
	const state = emptyState();
	rejects(() => getActivity(state, "nope"), 404);
	rejects(() => getActivity(state, "__proto__"), 404);
	rejects(() => getActivity(state, "constructor"), 404);
});

test("listActivities shows listed activities, newest first", () => {
	const state = emptyState();
	createActivity(state, { name: "Old", voter: "Sam" }, new Date("2026-01-01"));
	createActivity(state, { name: "Hidden", voter: "Sam", listed: false }, new Date("2026-01-02"));
	createActivity(state, { name: "New one", voter: "Sam", description: "d" }, new Date("2026-01-03"));
	assert.deepEqual(listActivities(state), [
		{ slug: "new-one", name: "New one", description: "d" },
		{ slug: "old", name: "Old", description: "" },
	]);
});

test("addChoice adds numbered choices and requires names", () => {
	const state = emptyState();
	makeActivity(state);
	assert.deepEqual(addChoice(state, "movie-night", { name: "Mortal Kombat", voter: "Sam" }), { id: "c1", name: "Mortal Kombat", description: "" });
	assert.equal(addChoice(state, "movie-night", { name: "Bowling", description: "Lanes", voter: "Jo" }).id, "c2");
	rejects(() => addChoice(state, "movie-night", { name: "Pool" }), 400);
	rejects(() => addChoice(state, "movie-night", { name: "", voter: "Sam" }), 400);
	rejects(() => addChoice(state, "nope", { name: "Pool", voter: "Sam" }), 404);
});

test("voterCode ignores case and spaces and differs per activity", () => {
	assert.equal(voterCode(SECRET, "a", " Sam "), voterCode(SECRET, "a", "sam"));
	assert.notEqual(voterCode(SECRET, "a", "sam"), voterCode(SECRET, "b", "sam"));
	assert.match(voterCode(SECRET, "a", "sam"), /^[0-9a-f]{64}$/);
	rejects(() => voterCode(SECRET, "a", " "), 400);
	rejects(() => voterCode(SECRET, "a", "x".repeat(41)), 400);
});

test("setVote stores votes under a code, never the name", () => {
	const state = emptyState();
	makeActivity(state);
	addChoice(state, "movie-night", { name: "A", voter: "Sam" });
	assert.deepEqual(setVote(state, SECRET, "movie-night", { voter: "Sam", choiceId: "c1", value: "yes" }), { c1: "yes" });
	assert.ok(!JSON.stringify(state).toLowerCase().includes("sam"));
});

test("setVote clears a vote with null and drops empty voters", () => {
	const state = emptyState();
	makeActivity(state);
	addChoice(state, "movie-night", { name: "A", voter: "Sam" });
	setVote(state, SECRET, "movie-night", { voter: "Sam", choiceId: "c1", value: "no" });
	assert.deepEqual(setVote(state, SECRET, "movie-night", { voter: "sam", choiceId: "c1", value: null }), {});
	assert.deepEqual(getActivity(state, "movie-night").votes, {});
});

test("setVote enforces one yes when multipleYes is off", () => {
	const state = emptyState();
	makeActivity(state, { multipleYes: false });
	addChoice(state, "movie-night", { name: "A", voter: "Sam" });
	addChoice(state, "movie-night", { name: "B", voter: "Sam" });
	setVote(state, SECRET, "movie-night", { voter: "Sam", choiceId: "c1", value: "yes" });
	assert.deepEqual(setVote(state, SECRET, "movie-night", { voter: "Sam", choiceId: "c2", value: "yes" }), { c2: "yes" });
});

test("setVote rejects bad input", () => {
	const state = emptyState();
	makeActivity(state);
	addChoice(state, "movie-night", { name: "A", voter: "Sam" });
	rejects(() => setVote(state, SECRET, "movie-night", { voter: "Sam", choiceId: "c9", value: "yes" }), 400);
	rejects(() => setVote(state, SECRET, "movie-night", { voter: "Sam", choiceId: "c1", value: "maybe" }), 400);
	rejects(() => setVote(state, SECRET, "movie-night", { voter: "Sam", choiceId: "c1" }), 400);
	rejects(() => setVote(state, SECRET, "movie-night", { choiceId: "c1", value: "yes" }), 400);
	rejects(() => setVote(state, SECRET, "nope", { voter: "Sam", choiceId: "c1", value: "yes" }), 404);
});

test("tally counts every choice, including empty ones", () => {
	const state = emptyState();
	const activity = makeActivity(state);
	addChoice(state, "movie-night", { name: "A", voter: "Sam" });
	addChoice(state, "movie-night", { name: "B", voter: "Sam" });
	setVote(state, SECRET, "movie-night", { voter: "Sam", choiceId: "c1", value: "yes" });
	setVote(state, SECRET, "movie-night", { voter: "Jo", choiceId: "c1", value: "no" });
	setVote(state, SECRET, "movie-night", { voter: "Al", choiceId: "c1", value: "none" });
	setVote(state, SECRET, "movie-night", { voter: "Al", choiceId: "c2", value: "yes" });
	assert.deepEqual(tally(activity), {
		c1: { yes: 1, no: 1, none: 1 },
		c2: { yes: 1, no: 0, none: 0 },
	});
});

test("publicView hides results before the reveal and never shows votes", () => {
	const state = emptyState();
	const activity = makeActivity(state, { revealAt: "2030-01-01T00:00:00.000Z" });
	addChoice(state, "movie-night", { name: "A", voter: "Sam" });
	setVote(state, SECRET, "movie-night", { voter: "Sam", choiceId: "c1", value: "yes" });
	const before = publicView(activity, SECRET, "Sam", new Date("2029-12-31T23:59:59.000Z"));
	assert.equal(before.results, null);
	assert.deepEqual(before.myVotes, { c1: "yes" });
	assert.equal(before.serverNow, "2029-12-31T23:59:59.000Z");
	assert.ok(!("votes" in before));
	const after = publicView(activity, SECRET, "", new Date("2030-01-01T00:00:00.000Z"));
	assert.deepEqual(after.results, { c1: { yes: 1, no: 0, none: 0 } });
	assert.deepEqual(after.myVotes, {});
});

test("publicView shows results right away when there is no reveal time", () => {
	const state = emptyState();
	const activity = makeActivity(state);
	assert.deepEqual(publicView(activity, SECRET, "", new Date()).results, {});
});

test("addChoices adds many choices, skipping blanks and duplicates", () => {
	const state = emptyState();
	makeActivity(state);
	addChoice(state, "movie-night", { name: "Bowling", voter: "Sam" });
	const result = addChoices(state, "movie-night", { voter: "Sam", names: [" Pool ", "", "bowling", "Darts", "pool", "  "] });
	assert.deepEqual(result, {
		added: [
			{ id: "c2", name: "Pool", description: "" },
			{ id: "c3", name: "Darts", description: "" },
		],
		skipped: 2,
	});
});

test("addChoices adds nothing when any line is bad", () => {
	const state = emptyState();
	makeActivity(state);
	assert.throws(
		() => addChoices(state, "movie-night", { voter: "Sam", names: ["Pool", "", "x".repeat(81)] }),
		(error) => error.status === 400 && error.message === "Line 3 must be 80 characters or fewer.",
	);
	assert.deepEqual(getActivity(state, "movie-night").choices, []);
});

test("addChoices checks the voter, the list, and the limit", () => {
	const state = emptyState();
	makeActivity(state);
	rejects(() => addChoices(state, "movie-night", { names: ["Pool"] }), 400);
	rejects(() => addChoices(state, "movie-night", { voter: "Sam", names: "Pool" }), 400);
	rejects(() => addChoices(state, "movie-night", { voter: "Sam", names: ["", " "] }), 400);
	rejects(() => addChoices(state, "movie-night", { voter: "Sam", names: Array.from({ length: 51 }, (_, i) => `C${i}`) }), 400);
	assert.equal(addChoices(state, "movie-night", { voter: "Sam", names: Array.from({ length: 50 }, (_, i) => `C${i}`) }).added.length, 50);
	rejects(() => addChoices(state, "nope", { voter: "Sam", names: ["Pool"] }), 404);
});
