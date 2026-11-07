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
