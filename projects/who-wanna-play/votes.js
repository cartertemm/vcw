export const VOTE_OPTIONS = [
	["yes", "Yes"],
	["no", "No"],
	["none", "No preference"],
];

export function applyVote(votes, choiceId, value, multipleYes) {
	const next = { ...votes };
	if (value === "yes" && !multipleYes) {
		for (const id of Object.keys(next)) {
			if (next[id] === "yes") delete next[id];
		}
	}
	if (value === null) delete next[choiceId];
	else next[choiceId] = value;
	return next;
}

export function applyRank(ranks, choiceId, rank) {
	const next = { ...ranks };
	const oldRank = next[choiceId];
	const holder = Object.keys(next).find((id) => id !== choiceId && next[id] === rank);
	if (rank === null) delete next[choiceId];
	else next[choiceId] = rank;
	if (holder && oldRank === undefined) delete next[holder];
	else if (holder) next[holder] = oldRank;
	return next;
}
