export const meta = {
	title: "Duel",
	description: "Two headlines, one real and one satire. Pick the real one. One wrong pick ends the round — how long a streak can you build?"
};

export function isCorrectPick(pair, pickedIndex) {
	return pair[pickedIndex].label === "real";
}
