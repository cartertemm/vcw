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

export const RESULT_COLUMNS = {
	yesno: [["name", "Choice"], ...VOTE_OPTIONS, ["score", "Score"]],
	ranking: [["name", "Choice"], ["points", "Points"], ["first", "1st place"], ["average", "Average rank"]],
};
const COLUMN_LABELS = Object.fromEntries([...RESULT_COLUMNS.yesno, ...RESULT_COLUMNS.ranking]);
const DIRECTION_WORDS = {
	name: { ascending: "A to Z", descending: "Z to A" },
	number: { ascending: "lowest first", descending: "highest first" },
};
const EMPTY_RANKING = { points: 0, first: 0, average: null };

export function resultRows(choices, results, type = "yesno") {
	return choices.map(({ id, name }) => {
		if (type === "ranking") return { id, name, ...(results[id] ?? EMPTY_RANKING) };
		const totals = results[id] ?? EMPTY_TOTALS;
		return { id, name, ...totals, score: totals.yes - totals.no };
	});
}

export function resultCaption(type, ballots) {
	return type === "ranking" ? `Points from ${plural(ballots, "complete ranking")}` : "Vote totals";
}

export function rankLabel(rank, total) {
	if (rank === 1) return "1 (favorite)";
	if (rank === total) return `${rank} (least favorite)`;
	return String(rank);
}

export function rankingProgress(ranked, total) {
	if (!total) return "";
	if (ranked === total) return "Your ranking is complete and counts.";
	return `You ranked ${ranked} of ${total}. Rank every choice so your vote counts.`;
}

export function sortRows(rows, sort) {
	if (!sort) return rows;
	const sign = sort.direction === "ascending" ? 1 : -1;
	const compare = sort.key === "name"
		? (a, b) => a.name.localeCompare(b.name)
		: (a, b) => a[sort.key] - b[sort.key];
	return [...rows].sort((a, b) => sign * compare(a, b));
}

export function nextSort(current, key) {
	if (current?.key === key) return { key, direction: current.direction === "ascending" ? "descending" : "ascending" };
	return { key, direction: key === "name" ? "ascending" : "descending" };
}

export function sortMessage(sort) {
	const words = DIRECTION_WORDS[sort.key === "name" ? "name" : "number"][sort.direction];
	return `Sorted by ${COLUMN_LABELS[sort.key]}, ${words}.`;
}

function plural(count, word) {
	return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function bulkAddedText(added, skipped) {
	const first = added ? `Added ${plural(added, "choice")}.` : "No new choices.";
	return skipped ? `${first} Skipped ${plural(skipped, "duplicate")}.` : first;
}

function votingRules(activity) {
	if (activity.type === "ranking") {
		return [
			"Give every choice a rank, from 1 (your favorite) to the last number (your least favorite).",
			"If you pick a rank another choice already has, the two swap.",
			"Your ranking only counts once every choice has a rank. If someone adds a new choice, rank it too.",
			"You can change your ranking any time. It saves as soon as you pick.",
			"Last place earns 1 point, and each place above earns 1 more. The most points wins.",
		];
	}
	return [
		"You can vote Yes, No, or No preference on each choice, or skip any of them.",
		"You can change your votes any time. They save as soon as you tap.",
		activity.multipleYes
			? "You can vote Yes on as many choices as you like."
			: "You can vote Yes on only one choice. A new Yes replaces your old one.",
	];
}

export function rulesText(activity) {
	return [
		...votingRules(activity),
		activity.revealAt
			? `Results show on ${formatDate(activity.revealAt)}. Until then, everyone sees a countdown.`
			: "Results show right away and update live.",
		"Anyone with the link can add choices.",
		activity.listed ? "This activity is on the main page." : "Only people with the link can find this activity.",
		PRIVACY_LINE,
		"With only a few voters, friends might be able to guess. It's all in good fun.",
	];
}
