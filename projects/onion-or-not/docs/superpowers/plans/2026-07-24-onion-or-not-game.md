# Onion or Not Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, vanilla-JS browser game (three modes: Classic, Duel, Survival) that quizzes players on real vs. Onion-satire headlines, using the existing `onion_titles.normalized.txt` / `nottheonion_titles.normalized.txt` datasets.

**Architecture:** `index.js` is the app shell (menu, instructions screen, mode mounting); `data.js` loads and shuffles both headline files behind a small `deck` API; each mode lives in its own file under `modes/` and owns its full lifecycle (instructions copy via a `meta` export, then `start()` renders game → results). Pure decision logic (tally/streak/score math, headline parsing, deck drawing) is factored out of DOM code so it can be unit tested with Node's built-in test runner; DOM rendering and focus management are verified manually in a browser per the spec's Testing section.

**Tech Stack:** Plain HTML/CSS/JS (ES modules, no bundler, no framework). `node --test` (Node's built-in test runner, zero dependencies) for pure-logic unit tests.

**Spec:** `docs/superpowers/specs/2026-07-24-onion-or-not-game-design.md`

---

## File structure

```
package.json           "type": "module" so index.js and node --test agree on ESM
index.html             entry point, single #app container
index.js               menu, instructions screen, mode mounting/onExit wiring
data.js                parseHeadlines, shuffle, makeDeck, loadDeck (fetch wiring)
dom-utils.js            escapeHtml, focusElement — tiny shared helpers used by index.js and every mode
style.css              shared button/layout shell
modes/
  classic.js           meta + updateTally (pure) + start() (DOM)
  duel.js              meta + isCorrectPick (pure) + start() (DOM)
  survival.js           meta + applyAnswer (pure) + constants + start() (DOM)
tests/
  data.test.js
  classic.test.js
  duel.test.js
  survival.test.js
```

`dom-utils.js` isn't in the spec's architecture section — it's a small implementation-level extraction (both `escapeHtml` and the tabindex/`.focus()` pattern are needed identically by `index.js` and all three modes) and doesn't change any structural decision the spec made.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `style.css`
- Create: `index.js` (placeholder)

- [ ] **Step 1: Create `package.json`**

```json
{
	"name": "onion-or-not-game",
	"version": "1.0.0",
	"private": true,
	"type": "module",
	"scripts": {
		"test": "node --test tests/"
	}
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>Onion or Not</title>
	<link rel="stylesheet" href="style.css">
</head>
<body>
	<main id="app"></main>
	<script type="module" src="index.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `style.css`**

```css
body {
	font-family: system-ui, sans-serif;
	max-width: 40rem;
	margin: 2rem auto;
	padding: 0 1rem;
	line-height: 1.5;
}

button {
	font-size: 1rem;
	padding: 0.5rem 1rem;
	margin: 0.25rem 0.25rem 0.25rem 0;
	cursor: pointer;
}

h1, h2 {
	outline: none;
}

h1:focus-visible, h2:focus-visible {
	outline: 2px solid #1a73e8;
	outline-offset: 2px;
}
```

- [ ] **Step 4: Create placeholder `index.js`**

```js
document.getElementById("app").innerHTML = "<h1>Onion or Not</h1><p>Loading...</p>";
```

- [ ] **Step 5: Verify the scaffold loads**

Open `index.html` directly in a browser (or `npx serve .` from this directory, then open the printed URL). Confirm the page shows "Onion or Not" / "Loading..." with no console errors.

- [ ] **Step 6: Commit**

```bash
git add package.json index.html style.css index.js
git commit -m "Add project scaffold for onion-or-not game"
```

---

### Task 2: `data.js` — headline parsing (TDD)

**Files:**
- Create: `data.js`
- Test: `tests/data.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/data.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHeadlines } from "../data.js";

test("parseHeadlines trims lines and tags each with the given label", () => {
	const raw = "First headline\nSecond headline\n";
	const result = parseHeadlines(raw, "real");
	assert.deepEqual(result, [
		{ text: "First headline", label: "real" },
		{ text: "Second headline", label: "real" }
	]);
});

test("parseHeadlines drops blank and whitespace-only lines", () => {
	const raw = "One\n\n   \nTwo\n";
	const result = parseHeadlines(raw, "satire");
	assert.equal(result.length, 2);
	assert.deepEqual(result.map(h => h.text), ["One", "Two"]);
});

test("parseHeadlines drops headlines over 200 characters", () => {
	const long = "x".repeat(201);
	const raw = `Short one\n${long}\n`;
	const result = parseHeadlines(raw, "real");
	assert.equal(result.length, 1);
	assert.equal(result[0].text, "Short one");
});

test("parseHeadlines keeps a headline exactly at the 200 character limit", () => {
	const exact = "x".repeat(200);
	const result = parseHeadlines(`${exact}\n`, "real");
	assert.equal(result.length, 1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/data.test.js`
Expected: FAIL (`data.js` doesn't exist yet / `parseHeadlines` is not exported)

- [ ] **Step 3: Create `data.js` with `parseHeadlines`**

```js
export const MAX_HEADLINE_LENGTH = 200;

export function parseHeadlines(rawText, label) {
	return rawText
		.split("\n")
		.map(line => line.trim())
		.filter(line => line.length > 0 && line.length <= MAX_HEADLINE_LENGTH)
		.map(text => ({ text, label }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/data.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add data.js tests/data.test.js
git commit -m "Add headline parsing to data.js"
```

---

### Task 3: `data.js` — shuffle and deck (TDD)

**Files:**
- Modify: `data.js`
- Test: `tests/data.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/data.test.js`:

```js
import { makeDeck } from "../data.js";

test("makeDeck.nextPair always returns one real and one satire headline", () => {
	const real = [{ text: "R1", label: "real" }];
	const satire = [{ text: "S1", label: "satire" }];
	const deck = makeDeck(real, satire, () => 0);
	const [a, b] = deck.nextPair();
	assert.deepEqual([a.label, b.label].sort(), ["real", "satire"]);
});

test("makeDeck.nextEither draws from the real pool when randomFn is below 0.5", () => {
	const real = [{ text: "R1", label: "real" }];
	const satire = [{ text: "S1", label: "satire" }];
	const deck = makeDeck(real, satire, () => 0);
	assert.equal(deck.nextEither().label, "real");
});

test("makeDeck recycles a pool once exhausted", () => {
	const real = [{ text: "R1", label: "real" }];
	const satire = [{ text: "S1", label: "satire" }];
	const deck = makeDeck(real, satire, () => 0); // always < 0.5 -> always draws "real"
	const first = deck.nextEither();
	const second = deck.nextEither();
	assert.equal(first.text, "R1");
	assert.equal(second.text, "R1");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/data.test.js`
Expected: FAIL (`makeDeck` is not exported)

- [ ] **Step 3: Add `shuffle` and `makeDeck` to `data.js`**

Append to `data.js`:

```js
export function shuffle(list, randomFn = Math.random) {
	const result = list.slice();
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(randomFn() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function makeDeck(realHeadlines, satireHeadlines, randomFn = Math.random) {
	let realPool = shuffle(realHeadlines, randomFn);
	let satirePool = shuffle(satireHeadlines, randomFn);
	let realIndex = 0;
	let satireIndex = 0;

	function drawReal() {
		if (realIndex >= realPool.length) {
			realPool = shuffle(realHeadlines, randomFn);
			realIndex = 0;
		}
		return realPool[realIndex++];
	}

	function drawSatire() {
		if (satireIndex >= satirePool.length) {
			satirePool = shuffle(satireHeadlines, randomFn);
			satireIndex = 0;
		}
		return satirePool[satireIndex++];
	}

	return {
		nextPair() {
			const real = drawReal();
			const satire = drawSatire();
			return randomFn() < 0.5 ? [real, satire] : [satire, real];
		},
		nextEither() {
			return randomFn() < 0.5 ? drawReal() : drawSatire();
		}
	};
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/data.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add data.js tests/data.test.js
git commit -m "Add shuffle and deck drawing to data.js"
```

---

### Task 4: `data.js` — fetch wiring

**Files:**
- Modify: `data.js`

Not unit tested: this function only does network fetch + delegates to already-tested `parseHeadlines`/`makeDeck`. Verified manually in Task 11 once the full app is wired up.

- [ ] **Step 1: Add `loadDeck` to `data.js`**

Append to `data.js`:

```js
export async function loadDeck() {
	const [satireText, realText] = await Promise.all([
		fetch("onion_titles.normalized.txt").then(response => response.text()),
		fetch("nottheonion_titles.normalized.txt").then(response => response.text())
	]);
	const satire = parseHeadlines(satireText, "satire");
	const real = parseHeadlines(realText, "real");
	return makeDeck(real, satire);
}
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

Run: `node --test tests/data.test.js`
Expected: PASS (7 tests — `loadDeck` isn't tested here, just confirming the file still parses/imports cleanly)

- [ ] **Step 3: Commit**

```bash
git add data.js
git commit -m "Add fetch wiring to data.js"
```

---

### Task 5: `dom-utils.js` — shared DOM helpers

**Files:**
- Create: `dom-utils.js`

Not unit tested: trivial DOM wrappers with no branching logic worth a Node test; covered implicitly by every mode's manual verification step.

- [ ] **Step 1: Create `dom-utils.js`**

```js
export function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

export function focusElement(element) {
	if (!element.hasAttribute("tabindex")) {
		element.setAttribute("tabindex", "-1");
	}
	element.focus();
}
```

- [ ] **Step 2: Commit**

```bash
git add dom-utils.js
git commit -m "Add shared DOM helpers"
```

---

### Task 6: Classic mode — pure logic (TDD)

**Files:**
- Create: `modes/classic.js`
- Test: `tests/classic.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/classic.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { updateTally } from "../modes/classic.js";

test("updateTally increments total every time and correct only when the guess was right", () => {
	let tally = { correct: 0, total: 0 };
	tally = updateTally(tally, true);
	assert.deepEqual(tally, { correct: 1, total: 1 });
	tally = updateTally(tally, false);
	assert.deepEqual(tally, { correct: 1, total: 2 });
});

test("updateTally does not mutate the tally it was given", () => {
	const original = { correct: 0, total: 0 };
	updateTally(original, true);
	assert.deepEqual(original, { correct: 0, total: 0 });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/classic.test.js`
Expected: FAIL (`modes/classic.js` doesn't exist yet)

- [ ] **Step 3: Create `modes/classic.js` with `meta` and `updateTally` only**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/classic.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add modes/classic.js tests/classic.test.js
git commit -m "Add Classic mode tally logic"
```

---

### Task 7: Classic mode — DOM rendering

**Files:**
- Modify: `modes/classic.js`

Not unit tested: DOM rendering and focus management, verified manually per spec's Testing section (this task's Step 2 below; full cross-mode pass happens in Task 14).

- [ ] **Step 1: Add `start()` to `modes/classic.js`**

Append to `modes/classic.js`:

```js
import { escapeHtml, focusElement } from "../dom-utils.js";

export function start(container, deck, onExit) {
	let tally = { correct: 0, total: 0 };

	function render() {
		const headline = deck.nextEither();
		container.innerHTML = `
			<button type="button" data-action="back">Back to menu</button>
			<h2 id="classic-headline">${escapeHtml(headline.text)}</h2>
			<p>Score: ${tally.correct} / ${tally.total}</p>
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
		container.querySelector("p:nth-of-type(1)").textContent = `Score: ${tally.correct} / ${tally.total}`;
		container.querySelector("#classic-controls").innerHTML =
			`<button type="button" data-action="next">Next</button>`;
		container.querySelector('[data-action="next"]').addEventListener("click", render);
	}

	render();
}
```

- [ ] **Step 2: Manually verify in the browser**

Serve the directory (e.g. `npx serve .`) and, once Task 12 wires up `index.js`, come back to this check: play a few Classic rounds, confirm the score updates, feedback announces correct/incorrect, and clicking "Next" moves focus to the new headline heading (inspect via keyboard Tab order and browser dev tools' accessibility pane). If `index.js` isn't wired yet, skip this verification and revisit it in Task 14's full pass.

- [ ] **Step 3: Run the pure-logic test suite to confirm nothing broke**

Run: `node --test tests/classic.test.js`
Expected: PASS (2 tests)

- [ ] **Step 4: Commit**

```bash
git add modes/classic.js
git commit -m "Add Classic mode DOM rendering"
```

---

### Task 8: Duel mode — pure logic (TDD)

**Files:**
- Create: `modes/duel.js`
- Test: `tests/duel.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/duel.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { isCorrectPick } from "../modes/duel.js";

test("isCorrectPick returns true when the picked headline is labeled real", () => {
	const pair = [{ text: "A", label: "real" }, { text: "B", label: "satire" }];
	assert.equal(isCorrectPick(pair, 0), true);
});

test("isCorrectPick returns false when the picked headline is labeled satire", () => {
	const pair = [{ text: "A", label: "real" }, { text: "B", label: "satire" }];
	assert.equal(isCorrectPick(pair, 1), false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/duel.test.js`
Expected: FAIL (`modes/duel.js` doesn't exist yet)

- [ ] **Step 3: Create `modes/duel.js` with `meta` and `isCorrectPick` only**

```js
export const meta = {
	title: "Duel",
	description: "Two headlines, one real and one satire. Pick the real one. One wrong pick ends the round — how long a streak can you build?"
};

export function isCorrectPick(pair, pickedIndex) {
	return pair[pickedIndex].label === "real";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/duel.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add modes/duel.js tests/duel.test.js
git commit -m "Add Duel mode pick-checking logic"
```

---

### Task 9: Duel mode — DOM rendering

**Files:**
- Modify: `modes/duel.js`

Not unit tested: DOM rendering and focus management, verified manually (this task's Step 2; full cross-mode pass in Task 14).

- [ ] **Step 1: Add `start()` to `modes/duel.js`**

Append to `modes/duel.js`:

```js
import { escapeHtml, focusElement } from "../dom-utils.js";

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
```

- [ ] **Step 2: Manually verify in the browser**

Once `index.js` is wired up (Task 12), play Duel: confirm focus lands on the first headline button on entry, both buttons announce the "Which one is real?" prompt via `aria-describedby` (check the accessibility tree in dev tools), a wrong pick shows the results screen with focus on its heading, and "Play again" restarts with streak reset to 0.

- [ ] **Step 3: Run the pure-logic test suite to confirm nothing broke**

Run: `node --test tests/duel.test.js`
Expected: PASS (2 tests)

- [ ] **Step 4: Commit**

```bash
git add modes/duel.js
git commit -m "Add Duel mode DOM rendering"
```

---

### Task 10: Survival mode — pure logic (TDD)

**Files:**
- Create: `modes/survival.js`
- Test: `tests/survival.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/survival.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyAnswer, SURVIVAL_START_SECONDS, SURVIVAL_CORRECT_BONUS, SURVIVAL_WRONG_PENALTY } from "../modes/survival.js";

test("applyAnswer adds bonus time and a point on a correct answer", () => {
	const result = applyAnswer({ secondsLeft: 30, score: 0 }, true);
	assert.deepEqual(result, { secondsLeft: 30 + SURVIVAL_CORRECT_BONUS, score: 1 });
});

test("applyAnswer subtracts the penalty and does not add a point on a wrong answer", () => {
	const result = applyAnswer({ secondsLeft: 30, score: 5 }, false);
	assert.deepEqual(result, { secondsLeft: 30 - SURVIVAL_WRONG_PENALTY, score: 5 });
});

test("SURVIVAL_START_SECONDS matches the spec's 30 second round", () => {
	assert.equal(SURVIVAL_START_SECONDS, 30);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/survival.test.js`
Expected: FAIL (`modes/survival.js` doesn't exist yet)

- [ ] **Step 3: Create `modes/survival.js` with constants, `meta`, and `applyAnswer` only**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/survival.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add modes/survival.js tests/survival.test.js
git commit -m "Add Survival mode timer/score logic"
```

---

### Task 11: Survival mode — DOM rendering and timer loop

**Files:**
- Modify: `modes/survival.js`

Not unit tested: timer-driven DOM rendering, verified manually (this task's Step 2; full cross-mode pass in Task 14).

- [ ] **Step 1: Add `start()` to `modes/survival.js`**

Append to `modes/survival.js`:

```js
import { escapeHtml, focusElement } from "../dom-utils.js";

export function start(container, deck, onExit) {
	let state = { secondsLeft: SURVIVAL_START_SECONDS, score: 0 };
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
			intervalId = setInterval(tick, 1000);
			render();
		});
		container.querySelector('[data-action="back"]').addEventListener("click", onExit);
	}
}
```

- [ ] **Step 2: Manually verify in the browser**

Once `index.js` is wired up (Task 12), play Survival: confirm the timer counts down, correct/wrong answers adjust the timer and score as expected, the round ends at 0 with focus on the results heading, and clicking "Back to menu" mid-round actually stops the interval (no console errors after leaving).

- [ ] **Step 3: Run the pure-logic test suite to confirm nothing broke**

Run: `node --test tests/survival.test.js`
Expected: PASS (3 tests)

- [ ] **Step 4: Commit**

```bash
git add modes/survival.js
git commit -m "Add Survival mode DOM rendering and timer loop"
```

---

### Task 12: `index.js` — menu, instructions, mode mounting

**Files:**
- Modify: `index.js`

Not unit tested: this is the app's DOM orchestration layer with no pure logic to extract beyond what's already tested in `data.js`. Verified manually in Task 14's full playthrough.

- [ ] **Step 1: Replace the placeholder `index.js`**

```js
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
```

- [ ] **Step 2: Manually verify the full app loads**

Serve the directory (`npx serve .` or any static server) and open it in a browser. Confirm: the menu loads with three mode buttons after the loading message disappears, clicking a mode shows its instructions screen with the correct title/description, "Start" enters that mode, and "Back to menu" from the instructions screen returns to the menu.

- [ ] **Step 3: Commit**

```bash
git add index.js
git commit -m "Wire up menu, instructions screen, and mode mounting"
```

---

### Task 13: Run the full automated test suite

**Files:** none (verification only)

- [ ] **Step 1: Run every test file together**

Run: `npm test`
Expected: PASS — all tests across `tests/data.test.js`, `tests/classic.test.js`, `tests/duel.test.js`, `tests/survival.test.js` (16 tests total)

- [ ] **Step 2: Fix and re-run if anything fails**

If any test fails, fix the corresponding source file (not the test) unless the test itself is wrong, then re-run `npm test` until everything passes.

---

### Task 14: Full playthrough and accessibility verification pass

**Files:** none (verification only, per the spec's Testing/verification section)

- [ ] **Step 1: Play Classic mode end to end**

Several rounds: confirm score updates, feedback text announces correct/incorrect via the live region, and clicking "Next" moves focus to the next headline heading.

- [ ] **Step 2: Play Duel mode to a loss**

Confirm focus lands on the first headline button on each new pair, a wrong pick shows the results screen with focus on its heading, and "Play again" resets the streak to 0.

- [ ] **Step 3: Play Survival mode to timeout**

Confirm the timer counts down, correct/wrong answers adjust time and score, and timeout shows the results screen with focus on its heading.

- [ ] **Step 4: Keyboard-only pass**

Using only Tab/Shift+Tab/Enter/Space (no mouse), play through all three modes' full flow (menu → instructions → game → results → back to menu). Confirm focus never gets lost (stuck on a removed element or thrown back to `<body>`) at any transition listed in the spec's Focus management section.

- [ ] **Step 5: Screen reader spot check**

Using NVDA (Windows) or VoiceOver (Mac), play through at least one full round of each mode. Confirm: headings are announced on each transition, Classic/Survival feedback is announced via the live region without a focus jump, and Duel's headline buttons announce the "Which one is real?" prompt via `aria-describedby`.

- [ ] **Step 6: Confirm no mislabeled or oversized headlines slip through**

Spot-check a handful of headlines seen during play against `onion_titles.normalized.txt` / `nottheonion_titles.normalized.txt` to confirm labels are correct, and confirm no headline over ~200 characters appeared.

- [ ] **Step 7: Final commit**

If Steps 1–6 required any fixes, commit them now with a message describing what was fixed. If nothing needed fixing, this task produces no commit.
