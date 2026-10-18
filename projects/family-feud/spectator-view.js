// Builds the data a spectator screen gets. Hidden answers become null here,
// so their text never leaves the host's device.

export function boardView(board, showAll = false) {
	return board.question.answers.map((answer, i) => {
		const found = board.isRevealed(i);
		if (!found && !showAll) return null;
		return { text: answer.text, points: answer.points, found };
	});
}

export function teamsView(game) {
	return game.teams.map(team => ({ name: team.name, score: team.score }));
}

export function fastMoneyRows(fm, player, revealedCount) {
	return fm.questions.map((question, q) => {
		if (q >= revealedCount) return null;
		const pick = fm.picks[player][q];
		const answer = pick === undefined || pick === null ? null : question.answers[pick];
		return { text: answer ? answer.text : "", points: answer ? answer.points : 0 };
	});
}
