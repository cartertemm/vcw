import { loadDeck } from "./data.js";
import { focusElement } from "./dom-utils.js";
import * as classic from "./modes/classic.js";
import * as duel from "./modes/duel.js";
import * as survival from "./modes/survival.js";

const MODES = [classic, duel, survival];
const app = document.getElementById("app");

async function main() {
	renderLoading();
	let deck;
	try {
		deck = await loadDeck();
	} catch (error) {
		renderError();
		return;
	}
	renderMenu(deck);
}

function renderLoading() {
	app.innerHTML = `<h1>Onion or Not</h1><p>Loading headlines...</p>`;
	focusElement(app.querySelector("h1"));
}

function renderError() {
	app.innerHTML = `<h1>Onion or Not</h1><p>Couldn't load headlines — reload the page.</p>`;
	focusElement(app.querySelector("h1"));
}

function renderMenu(deck) {
	app.innerHTML = `
		<h1>Onion or Not</h1>
		<div>
			${MODES.map((mode, index) => `<button type="button" data-mode="${index}">${mode.meta.title}</button>`).join("")}
		</div>
	`;
	focusElement(app.querySelector("h1"));
	app.querySelectorAll("[data-mode]").forEach(button => {
		button.addEventListener("click", () => {
			renderInstructions(MODES[Number(button.dataset.mode)], deck);
		});
	});
}

function renderInstructions(mode, deck) {
	app.innerHTML = `
		<h2>${mode.meta.title}</h2>
		<p>${mode.meta.description}</p>
		<button type="button" data-action="start">Start</button>
		<button type="button" data-action="back">Back to menu</button>
	`;
	focusElement(app.querySelector("h2"));
	app.querySelector('[data-action="start"]').addEventListener("click", () => {
		mode.start(app, deck, () => renderMenu(deck));
	});
	app.querySelector('[data-action="back"]').addEventListener("click", () => renderMenu(deck));
}

main();
