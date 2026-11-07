import { createHmac } from "node:crypto";
import { VOTE_OPTIONS, applyRank, applyVote } from "./votes.js";

export const LIMITS = { name: 80, description: 500, slug: 40, voter: 40 };
export const MAX_BULK_CHOICES = 50;
const VOTE_VALUES = VOTE_OPTIONS.map(([value]) => value);
const RESERVED_SLUGS = new Set(["new", "api", "data"]);
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const POLL_TYPES = ["yesno", "ranking"];

export class StoreError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

export function emptyState() {
	return { activities: {}, events: {} };
}

function cleanText(value, field, max, required) {
	const text = typeof value === "string" ? value.trim() : "";
	if (required && !text) throw new StoreError(400, `${field} is required.`);
	if (text.length > max) throw new StoreError(400, `${field} must be ${max} characters or fewer.`);
	return text;
}

function cleanVoter(voter) {
	return cleanText(voter, "Your name", LIMITS.voter, true);
}

function trimSlug(text, max) {
	return text.slice(0, max).replace(/-+$/, "");
}

export function slugify(name) {
	const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
	return trimSlug(slug, LIMITS.slug) || "activity";
}

function joinPath(eventSlug, slug) {
	return eventSlug ? `${eventSlug}/${slug}` : slug;
}

function isFree(state, slug, eventSlug) {
	if (RESERVED_SLUGS.has(slug) || joinPath(eventSlug, slug) in state.activities) return false;
	return Boolean(eventSlug) || !(slug in (state.events ?? {}));
}

function chooseSlug(state, requested, name, eventSlug = null) {
	const typed = cleanText(requested, "Slug", LIMITS.slug, false).toLowerCase();
	if (typed) {
		if (!SLUG_PATTERN.test(typed)) throw new StoreError(400, "Slug can use only letters, numbers, and single hyphens.");
		if (!isFree(state, typed, eventSlug)) throw new StoreError(409, "That slug is taken.");
		return typed;
	}
	const base = slugify(name);
	if (isFree(state, base, eventSlug)) return base;
	for (let number = 2; ; number++) {
		const suffix = `-${number}`;
		const candidate = trimSlug(base, LIMITS.slug - suffix.length) + suffix;
		if (isFree(state, candidate, eventSlug)) return candidate;
	}
}

function parseRevealAt(value) {
	if (value === null || value === undefined || value === "") return null;
	const time = typeof value === "string" ? Date.parse(value) : NaN;
	if (Number.isNaN(time)) throw new StoreError(400, "Show results at is not a valid date.");
	return new Date(time).toISOString();
}

function parseType(value) {
	if (value === undefined) return "yesno";
	if (!POLL_TYPES.includes(value)) throw new StoreError(400, "Poll type must be yesno or ranking.");
	return value;
}

function pollType(activity) {
	return activity.type ?? "yesno";
}

export function createEvent(state, input, now = new Date()) {
	cleanVoter(input.voter);
	const name = cleanText(input.name, "Name", LIMITS.name, true);
	const event = {
		slug: "",
		name,
		description: cleanText(input.description, "Description", LIMITS.description, false),
		listed: input.listed !== false,
		createdAt: now.toISOString(),
	};
	event.slug = chooseSlug(state, input.slug, name);
	state.events[event.slug] = event;
	return event;
}

export function getEvent(state, slug) {
	if (!Object.hasOwn(state.events, slug)) throw new StoreError(404, "Event not found.");
	return state.events[slug];
}

function newestFirst(a, b) {
	return b.createdAt.localeCompare(a.createdAt);
}

export function listEvents(state) {
	return Object.values(state.events)
		.filter((event) => event.listed)
		.sort(newestFirst)
		.map(({ slug, name, description }) => ({ slug, name, description }));
}

export function eventView(state, slug) {
	const { name, description, listed } = getEvent(state, slug);
	const activities = Object.values(state.activities)
		.filter((activity) => activity.event === slug && activity.listed)
		.sort(newestFirst)
		.map((activity) => ({ slug: activity.slug, name: activity.name, description: activity.description, path: activity.path }));
	return { slug, name, description, listed, activities };
}

function activityPath(activity) {
	return activity.path ?? activity.slug;
}

export function createActivity(state, input, now = new Date(), eventSlug = null) {
	if (eventSlug) getEvent(state, eventSlug);
	cleanVoter(input.voter);
	const name = cleanText(input.name, "Name", LIMITS.name, true);
	const activity = {
		slug: "",
		type: parseType(input.type),
		name,
		description: cleanText(input.description, "Description", LIMITS.description, false),
		listed: input.listed !== false,
		multipleYes: input.multipleYes !== false,
		revealAt: parseRevealAt(input.revealAt),
		createdAt: now.toISOString(),
		choices: [],
		votes: {},
	};
	activity.slug = chooseSlug(state, input.slug, name, eventSlug);
	activity.path = joinPath(eventSlug, activity.slug);
	activity.event = eventSlug;
	state.activities[activity.path] = activity;
	return activity;
}

export function getActivity(state, slug) {
	if (!Object.hasOwn(state.activities, slug)) throw new StoreError(404, "Activity not found.");
	return state.activities[slug];
}

export function listActivities(state) {
	return Object.values(state.activities)
		.filter((activity) => activity.listed && !activity.event)
		.sort(newestFirst)
		.map(({ slug, name, description }) => ({ slug, name, description }));
}

export function addChoice(state, slug, input) {
	const activity = getActivity(state, slug);
	cleanVoter(input.voter);
	const choice = {
		id: `c${activity.choices.length + 1}`,
		name: cleanText(input.name, "Choice name", LIMITS.name, true),
		description: cleanText(input.description, "Description", LIMITS.description, false),
	};
	activity.choices.push(choice);
	return choice;
}

export function addChoices(state, slug, input) {
	const activity = getActivity(state, slug);
	cleanVoter(input.voter);
	if (!Array.isArray(input.names)) throw new StoreError(400, "Choices must be a list.");
	const lines = input.names
		.map((name, index) => cleanText(name, `Line ${index + 1}`, LIMITS.name, false))
		.filter(Boolean);
	if (!lines.length) throw new StoreError(400, "Add at least one choice.");
	if (lines.length > MAX_BULK_CHOICES) throw new StoreError(400, `You can add up to ${MAX_BULK_CHOICES} choices at once.`);
	const seen = new Set(activity.choices.map((choice) => choice.name.toLowerCase()));
	const names = lines.filter((name) => {
		const key = name.toLowerCase();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	const added = names.map((name) => {
		const choice = { id: `c${activity.choices.length + 1}`, name, description: "" };
		activity.choices.push(choice);
		return choice;
	});
	return { added, skipped: lines.length - names.length };
}

export function voterCode(secret, slug, voter) {
	const name = cleanVoter(voter).toLowerCase();
	return createHmac("sha256", secret).update(`${slug}\n${name}`).digest("hex");
}

export function setVote(state, secret, slug, input) {
	const activity = getActivity(state, slug);
	const code = voterCode(secret, slug, input.voter);
	if (!activity.choices.some((choice) => choice.id === input.choiceId)) throw new StoreError(400, "That choice does not exist.");
	const current = activity.votes[code] ?? {};
	let votes;
	if (pollType(activity) === "ranking") {
		const valid = input.value === null || (Number.isInteger(input.value) && input.value >= 1 && input.value <= activity.choices.length);
		if (!valid) throw new StoreError(400, `Rank must be a whole number from 1 to ${activity.choices.length}, or null.`);
		votes = applyRank(current, input.choiceId, input.value);
	} else {
		if (input.value !== null && !VOTE_VALUES.includes(input.value)) throw new StoreError(400, "Vote must be yes, no, none, or null.");
		votes = applyVote(current, input.choiceId, input.value, activity.multipleYes);
	}
	if (Object.keys(votes).length) activity.votes[code] = votes;
	else delete activity.votes[code];
	return votes;
}

export function tally(activity) {
	const totals = Object.fromEntries(activity.choices.map((choice) => [choice.id, { yes: 0, no: 0, none: 0 }]));
	for (const votes of Object.values(activity.votes)) {
		for (const [choiceId, value] of Object.entries(votes)) totals[choiceId][value] += 1;
	}
	return totals;
}

function rankingTally(activity) {
	const count = activity.choices.length;
	const ballots = Object.values(activity.votes).filter((ranks) => Object.keys(ranks).length === count);
	const totals = Object.fromEntries(activity.choices.map(({ id }) => {
		const ranks = ballots.map((ballot) => ballot[id]);
		const sum = ranks.reduce((total, rank) => total + rank, 0);
		return [id, {
			points: ranks.reduce((total, rank) => total + count + 1 - rank, 0),
			first: ranks.filter((rank) => rank === 1).length,
			average: ranks.length ? Math.round((sum / ranks.length) * 10) / 10 : null,
		}];
	}));
	return { ballots: ballots.length, totals };
}

function resultsView(activity, revealed) {
	if (pollType(activity) !== "ranking") return { results: revealed ? tally(activity) : null };
	if (!revealed) return { results: null, ballots: null };
	const { ballots, totals } = rankingTally(activity);
	return { results: totals, ballots };
}

export function publicView(activity, secret, voter, now, event = null) {
	const revealed = !activity.revealAt || Date.parse(activity.revealAt) <= now.getTime();
	const path = activityPath(activity);
	const myVotes = voter ? activity.votes[voterCode(secret, path, voter)] ?? {} : {};
	return {
		slug: activity.slug,
		path,
		event,
		type: pollType(activity),
		name: activity.name,
		description: activity.description,
		listed: activity.listed,
		multipleYes: activity.multipleYes,
		revealAt: activity.revealAt,
		choices: activity.choices,
		myVotes,
		serverNow: now.toISOString(),
		...resultsView(activity, revealed),
	};
}
