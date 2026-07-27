export function createScoreboard(names) {
	const scores = new Map(names.map(name => [name, 0]));

	return {
		addPoint(name) {
			scores.set(name, scores.get(name) + 1);
		},
		getScore(name) {
			return scores.get(name);
		},
		getWinner(targetScore) {
			return names.find(name => scores.get(name) >= targetScore) ?? null;
		},
		sortedEntries() {
			// Array.prototype.sort is stable, so equal scores keep `names` order.
			return names
				.map(name => ({ name, score: scores.get(name) }))
				.sort((a, b) => b.score - a.score);
		},
	};
}
