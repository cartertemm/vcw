export const meta = {
	title: "Classic",
	description: "One headline at a time. Guess whether it's real news or Onion satire. No time limit and no fail state — just see how many you get right."
};

export function updateTally(tally, correct) {
	return {
		correct: tally.correct + (correct ? 1 : 0),
		total: tally.total + 1
	};
}
