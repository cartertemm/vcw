import { VOTE_OPTIONS } from "./votes.js";

const UNITS = [
	["day", 86400],
	["hour", 3600],
	["minute", 60],
	["second", 1],
];
const EMPTY_TOTALS = { yes: 0, no: 0, none: 0 };

export const PRIVACY_LINE = "Results show totals only. The app never shows who picked what.";

export function formatDate(iso) {
	return new Date(iso).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
}

export function countdownText(ms) {
	let remaining = Math.max(0, Math.ceil(ms / 1000));
	const counts = UNITS.map(([unit, size]) => {
		const count = Math.floor(remaining / size);
		remaining -= count * size;
		return [unit, count];
	});
	const first = counts.findIndex(([, count]) => count > 0);
	if (first === -1) return "Results any second now";
	const parts = counts
		.slice(first, first + 2)
		.filter(([, count]) => count > 0)
		.map(([unit, count]) => `${count} ${unit}${count === 1 ? "" : "s"}`);
	return `Results in ${parts.join(", ")}`;
}

export function tallyText(totals = EMPTY_TOTALS) {
	return VOTE_OPTIONS.map(([value, label]) => `${label} ${totals[value]}`).join(", ");
}

function plural(count, word) {
	return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function bulkAddedText(added, skipped) {
	const first = added ? `Added ${plural(added, "choice")}.` : "No new choices.";
	return skipped ? `${first} Skipped ${plural(skipped, "duplicate")}.` : first;
}

export function rulesText(activity) {
	return [
		"You can vote Yes, No, or No preference on each choice, or skip any of them.",
		"You can change your votes any time. They save as soon as you tap.",
		activity.multipleYes
			? "You can vote Yes on as many choices as you like."
			: "You can vote Yes on only one choice. A new Yes replaces your old one.",
		activity.revealAt
			? `Results show on ${formatDate(activity.revealAt)}. Until then, everyone sees a countdown.`
			: "Results show right away and update live.",
		"Anyone with the link can add choices.",
		activity.listed ? "This activity is on the main page." : "Only people with the link can find this activity.",
		PRIVACY_LINE,
		"With only a few voters, friends might be able to guess. It's all in good fun.",
	];
}
