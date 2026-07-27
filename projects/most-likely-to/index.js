import { escapeHtml, focusElement, announce } from "./dom-utils.js";
import { isIOS, isIOSStandalone } from "./platform.js";
import { validateSetup } from "./validation.js";
import { createScoreboard } from "./scoring.js";
import { createPromptPool, loadPrompts } from "./data.js";

const CATEGORIES = [
	{ key: "sfw", label: "SFW" },
	{ key: "nsfw", label: "NSFW" },
	{ key: "anythingGoes", label: "Anything Goes" },
];

const app = document.getElementById("app");
const statusEl = document.getElementById("status");

function setupGate() {
	const gate = document.getElementById("install-gate");
	if (isIOS() && !isIOSStandalone()) {
		gate.hidden = false;
		const continueButton = document.getElementById("continue-anyway");
		focusElement(continueButton);
		continueButton.addEventListener("click", () => {
			gate.hidden = true;
			app.hidden = false;
		});
	} else {
		app.hidden = false;
	}
}

function confirmQuit() {
	return window.confirm(
		"Are you sure you would like to quit the current game and go back to the main menu? All progress will be lost"
	);
}

function renderLoading() {
	app.innerHTML = `<h1>Most Likely To</h1><p>Loading prompts...</p>`;
	focusElement(app.querySelector("h1"));
}

function renderError() {
	app.innerHTML = `<h1>Most Likely To</h1><p>Couldn't load prompts — reload the page.</p>`;
	focusElement(app.querySelector("h1"));
}

function renderMenu(prompts) {
	app.innerHTML = `
		<h1>Most Likely To</h1>
		<div>
			${CATEGORIES.map(c => `<button type="button" data-category="${c.key}">${c.label}</button>`).join("")}
		</div>
	`;
	focusElement(app.querySelector("h1"));
	app.querySelectorAll("[data-category]").forEach(button => {
		button.addEventListener("click", () => {
			const category = CATEGORIES.find(c => c.key === button.dataset.category);
			renderSetup(category, prompts);
		});
	});
}

function renderSetup(category, prompts, previousNamesText = "", previousTargetScoreText = "5", errorMessage = "") {
	app.innerHTML = `
		<h2>${category.label}</h2>
		<label for="player-names">Player names (one per line)</label>
		<textarea id="player-names" rows="8"></textarea>
		<label for="target-score">Target score</label>
		<input type="number" id="target-score" min="1">
		${errorMessage ? `<p class="error">${escapeHtml(errorMessage)}</p>` : ""}
		<button type="button" data-action="continue">Continue</button>
		<button type="button" data-action="back">Back</button>
	`;
	// Set via .value rather than templating into the HTML string: these came from
	// user input on a previous attempt and might contain characters that would
	// break the surrounding markup if interpolated directly (see index.js's note
	// on escapeHtml not being attribute-safe).
	app.querySelector("#player-names").value = previousNamesText;
	app.querySelector("#target-score").value = previousTargetScoreText;
	focusElement(app.querySelector("h2"));
	app.querySelector('[data-action="continue"]').addEventListener("click", () => {
		const namesText = app.querySelector("#player-names").value;
		const targetScoreText = app.querySelector("#target-score").value;
		const result = validateSetup(namesText, targetScoreText);
		if (!result.valid) {
			announce(statusEl, result.error);
			renderSetup(category, prompts, namesText, targetScoreText, result.error);
			return;
		}
		renderGame(category, prompts, result.names, result.targetScore);
	});
	app.querySelector('[data-action="back"]').addEventListener("click", () => {
		renderMenu(prompts);
	});
}

function renderGame(category, prompts, names, targetScore) {
	const pool = createPromptPool(prompts[category.key]);
	const scoreboard = createScoreboard(names);

	function renderRound() {
		const prompt = pool.next();
		app.innerHTML = `
			<h2>Most likely to... ${escapeHtml(prompt)}</h2>
			<div id="player-buttons"></div>
			<button type="button" data-action="quit">Back to menu</button>
		`;
		const playerButtonsContainer = app.querySelector("#player-buttons");
		names.forEach(name => {
			const score = scoreboard.getScore(name);
			const button = document.createElement("button");
			button.type = "button";
			button.dataset.player = name;
			button.textContent = `${name}, ${score} point${score === 1 ? "" : "s"}`;
			button.addEventListener("click", () => {
				scoreboard.addPoint(name);
				const winner = scoreboard.getWinner(targetScore);
				if (winner) {
					renderResults(category, prompts, names, targetScore, scoreboard, winner);
				} else {
					renderRound();
				}
			});
			playerButtonsContainer.appendChild(button);
		});
		focusElement(app.querySelector("h2"));
		app.querySelector('[data-action="quit"]').addEventListener("click", () => {
			if (confirmQuit()) {
				renderMenu(prompts);
			}
		});
	}

	renderRound();
}

function renderResults(category, prompts, names, targetScore, scoreboard, winner) {
	const entries = scoreboard.sortedEntries();
	app.innerHTML = `
		<h2>${escapeHtml(winner)} reached ${targetScore} points!</h2>
		<ul>
			${entries.map(e => `<li>${escapeHtml(e.name)}: ${e.score} point${e.score === 1 ? "" : "s"}</li>`).join("")}
		</ul>
		<button type="button" data-action="again">Play again</button>
		<button type="button" data-action="quit">Back to menu</button>
	`;
	focusElement(app.querySelector("h2"));
	app.querySelector('[data-action="again"]').addEventListener("click", () => {
		renderGame(category, prompts, names, targetScore);
	});
	app.querySelector('[data-action="quit"]').addEventListener("click", () => {
		if (confirmQuit()) {
			renderMenu(prompts);
		}
	});
}

async function main() {
	setupGate();
	// Reading navigator.serviceWorker throws a SecurityError in sandboxed
	// iframes (opaque origin), e.g. the VibeCode Weekly demo runner.
	try {
		navigator.serviceWorker.register("sw.js").catch(() => {});
	} catch (e) {}

	renderLoading();
	let prompts;
	try {
		prompts = await loadPrompts();
	} catch (error) {
		renderError();
		return;
	}
	renderMenu(prompts);
}

main();
