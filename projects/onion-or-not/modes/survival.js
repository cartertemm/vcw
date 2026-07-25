export const SURVIVAL_START_SECONDS = 30;
export const SURVIVAL_CORRECT_BONUS = 1;
export const SURVIVAL_WRONG_PENALTY = 3;

export const meta = {
	title: "Survival",
	description: `You have ${SURVIVAL_START_SECONDS} seconds. Correct answers add ${SURVIVAL_CORRECT_BONUS}s and a point; wrong answers cost ${SURVIVAL_WRONG_PENALTY}s. Answer as many as you can before time runs out.`
};

export function applyAnswer(state, correct) {
	const delta = correct ? SURVIVAL_CORRECT_BONUS : -SURVIVAL_WRONG_PENALTY;
	return {
		secondsLeft: state.secondsLeft + delta,
		score: state.score + (correct ? 1 : 0)
	};
}
