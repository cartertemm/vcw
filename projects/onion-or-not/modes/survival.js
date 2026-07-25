import { escapeHtml, focusElement } from "../dom-utils.js";

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

export function start(container, deck, onExit) {
	let state = { secondsLeft: SURVIVAL_START_SECONDS, score: 0 };
	let pendingFeedback = "";
	let intervalId = setInterval(tick, 1000);
	render();

	function tick() {
		state = { ...state, secondsLeft: state.secondsLeft - 1 };
		if (state.secondsLeft <= 0) {
			clearInterval(intervalId);
			showResults();
			return;
		}
		const timerEl = container.querySelector("#survival-timer");
		if (timerEl) timerEl.textContent = `Time: ${state.secondsLeft}s`;
	}

	function render() {
		const headline = deck.nextEither();
		container.innerHTML = `
			<button type="button" data-action="back">Back to menu</button>
			<p id="survival-timer">Time: ${state.secondsLeft}s</p>
			<p>Score: ${state.score}</p>
			<h2 id="survival-headline">${escapeHtml(headline.text)}</h2>
			<div>
				<button type="button" data-answer="real">Real</button>
				<button type="button" data-answer="satire">Satire</button>
			</div>
			<p aria-live="polite" id="survival-feedback">${escapeHtml(pendingFeedback)}</p>
		`;
		focusElement(container.querySelector("#survival-headline"));
		container.querySelector('[data-action="back"]').addEventListener("click", () => {
			clearInterval(intervalId);
			onExit();
		});
		container.querySelectorAll("[data-answer]").forEach(button => {
			button.addEventListener("click", () => handleAnswer(headline, button.dataset.answer));
		});
	}

	function handleAnswer(headline, guess) {
		const correct = guess === headline.label;
		state = applyAnswer(state, correct);
		pendingFeedback = correct
			? `Correct — this was ${headline.label}.`
			: `Incorrect — this was ${headline.label}.`;
		if (state.secondsLeft <= 0) {
			clearInterval(intervalId);
			showResults();
			return;
		}
		render();
	}

	function showResults() {
		container.innerHTML = `
			<h2 id="survival-result">Time's up — final score: ${state.score}</h2>
			<button type="button" data-action="again">Play again</button>
			<button type="button" data-action="back">Back to menu</button>
		`;
		focusElement(container.querySelector("#survival-result"));
		container.querySelector('[data-action="again"]').addEventListener("click", () => {
			state = { secondsLeft: SURVIVAL_START_SECONDS, score: 0 };
			pendingFeedback = "";
			intervalId = setInterval(tick, 1000);
			render();
		});
		container.querySelector('[data-action="back"]').addEventListener("click", onExit);
	}
}
