import { escapeHtml, focusElement } from "../dom-utils.js";

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

export function start(container, deck, onExit) {
	let tally = { correct: 0, total: 0 };

	function render() {
		const headline = deck.nextEither();
		container.innerHTML = `
			<button type="button" data-action="back">Back to menu</button>
			<h2 id="classic-headline">${escapeHtml(headline.text)}</h2>
			<p id="classic-score">Score: ${tally.correct} / ${tally.total}</p>
			<div id="classic-controls">
				<button type="button" data-answer="real">Real</button>
				<button type="button" data-answer="satire">Satire</button>
			</div>
			<p aria-live="polite" id="classic-feedback"></p>
		`;
		focusElement(container.querySelector("#classic-headline"));
		container.querySelector('[data-action="back"]').addEventListener("click", onExit);
		container.querySelectorAll("[data-answer]").forEach(button => {
			button.addEventListener("click", () => handleAnswer(headline, button.dataset.answer));
		});
	}

	function handleAnswer(headline, guess) {
		const correct = guess === headline.label;
		tally = updateTally(tally, correct);
		container.querySelector("#classic-feedback").textContent = correct
			? `Correct — this was ${headline.label}.`
			: `Incorrect — this was ${headline.label}.`;
		container.querySelector("#classic-score").textContent = `Score: ${tally.correct} / ${tally.total}`;
		container.querySelector("#classic-controls").innerHTML =
			`<button type="button" data-action="next">Next</button>`;
		container.querySelector('[data-action="next"]').addEventListener("click", render);
	}

	render();
}
