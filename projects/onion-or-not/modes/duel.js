import { escapeHtml, focusElement } from "../dom-utils.js";

export const meta = {
	title: "Duel",
	description: "Two headlines, one real and one satire. Pick the real one. One wrong pick ends the round — how long a streak can you build?"
};

export function isCorrectPick(pair, pickedIndex) {
	return pair[pickedIndex].label === "real";
}

export function start(container, deck, onExit) {
	let streak = 0;
	render();

	function render() {
		const pair = deck.nextPair();
		container.innerHTML = `
			<button type="button" data-action="back">Back to menu</button>
			<h2 id="duel-prompt">Which one is real?</h2>
			<p>Streak: ${streak}</p>
			<div>
				<button type="button" data-index="0" aria-describedby="duel-prompt">${escapeHtml(pair[0].text)}</button>
				<button type="button" data-index="1" aria-describedby="duel-prompt">${escapeHtml(pair[1].text)}</button>
			</div>
		`;
		container.querySelector('[data-action="back"]').addEventListener("click", onExit);
		const choiceButtons = container.querySelectorAll("[data-index]");
		choiceButtons.forEach(button => {
			button.addEventListener("click", () => handlePick(pair, Number(button.dataset.index)));
		});
		focusElement(choiceButtons[0]);
	}

	function handlePick(pair, index) {
		if (isCorrectPick(pair, index)) {
			streak += 1;
			render();
		} else {
			showResults(pair);
		}
	}

	function showResults(pair) {
		const realHeadline = pair.find(headline => headline.label === "real");
		container.innerHTML = `
			<h2 id="duel-result">Final streak: ${streak}</h2>
			<p>The real headline was: "${escapeHtml(realHeadline.text)}"</p>
			<button type="button" data-action="again">Play again</button>
			<button type="button" data-action="back">Back to menu</button>
		`;
		focusElement(container.querySelector("#duel-result"));
		container.querySelector('[data-action="again"]').addEventListener("click", () => {
			streak = 0;
			render();
		});
		container.querySelector('[data-action="back"]').addEventListener("click", onExit);
	}
}
