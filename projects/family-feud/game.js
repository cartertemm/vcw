export const DEFAULT_TARGET = 300;
export const MAX_STRIKES = 3;
export const FAST_MONEY_GOAL = 200;
export const FAST_MONEY_QUESTIONS = 5;

const ROUND_MULTIPLIERS = [1, 1, 2, 3];

export function multiplierForRound(roundNumber) {
	return ROUND_MULTIPLIERS[roundNumber - 1] ?? 1;
}

// Ranks are 0-based answer indexes, or null for an answer not on the board.
export function faceOffWinner(firstRank, secondRank) {
	if (firstRank === null && secondRank === null) return null;
	if (secondRank === null) return "first";
	if (firstRank === null) return "second";
	return firstRank <= secondRank ? "first" : "second";
}

export function createBoard(question) {
	const revealed = new Set();
	return {
		question,
		reveal(index) {
			revealed.add(index);
			return question.answers[index].points;
		},
		isRevealed(index) {
			return revealed.has(index);
		},
		isCleared() {
			return revealed.size === question.answers.length;
		},
		bank() {
			return [...revealed].reduce((sum, i) => sum + question.answers[i].points, 0);
		},
	};
}

export function validateSetup(teamOneText, teamTwoText, targetText) {
	const teams = [teamOneText.trim(), teamTwoText.trim()];
	if (teams.some(name => name === "")) {
		return { valid: false, error: "Give both families a name." };
	}
	if (teams[0].toLowerCase() === teams[1].toLowerCase()) {
		return { valid: false, error: "The two families need different names." };
	}
	const target = Number(targetText);
	if (!Number.isInteger(target) || target < 1) {
		return { valid: false, error: "Points needed to win has to be a whole number, like 300." };
	}
	return { valid: true, teams, target };
}
