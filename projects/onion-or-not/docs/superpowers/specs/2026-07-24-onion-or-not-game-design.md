# Onion or Not — browser game design

## Purpose

A browser game built on the existing `onion_titles.normalized.txt` (satire, from The Onion) and `nottheonion_titles.normalized.txt` (real, from r/nottheonion) datasets. Players guess whether a headline is real news or Onion satire, across three modes.

## Architecture

Plain HTML/CSS/JS. No build step, no framework, no bundler.

```
index.html          entry point, single #app container
index.js            main loop: loads data once, shows menu, mounts/unmounts modes
data.js             fetches + parses both .txt files into a shared headline pool
modes/
  classic.js        endless real-vs-satire guessing
  duel.js           two headlines, pick the real one, streak until first miss
  survival.js       timed rapid-fire, wrong answers cost time
style.css
```

Each mode module exports a single function `start(container, deck, onExit)`. `index.js` owns the menu screen and the `#app` container. Picking a mode clears the container and shows that mode's instructions screen (see below); starting the mode calls its `start()`, passing the shared `deck` and a callback (`onExit`) that returns control to the menu. Modes don't know about each other or about routing.

## Data layer (`data.js`)

On page load, fetches both normalized `.txt` files:
- `onion_titles.normalized.txt` → label `satire`
- `nottheonion_titles.normalized.txt` → label `real`

Each file is split on newlines. Empty lines and headlines over ~200 characters (a handful of outliers run to 900+ characters and would break the layout) are dropped. Both lists are shuffled once at load.

Returns a `deck` object with:
- `next(type)` — pops the next headline of a given label (`'real'` or `'satire'`), reshuffling and recycling from the start when a list is exhausted
- `nextPair()` — one real + one satire headline for Duel mode, randomly assigned left/right
- `nextEither()` — a single headline picked at random from either pool, tagged with its true label (for Classic and Survival)

Loading happens once at startup. The menu shows a loading message until both fetches resolve. If either fetch fails, the menu is replaced with a plain error message ("Couldn't load headlines — reload the page.") with no retry logic, since this is a static local fetch.

## Screen flow (all modes)

1. **Menu** — heading "Onion or Not", three mode buttons (Classic, Duel, Survival).
2. **Instructions screen** (per mode) — mode title heading, a brief plain-language description of the mode's rules, a "Start" button, and a "Back to menu" button.
3. **Game screen** — the mode's actual play loop.
4. **Results** (Duel loss / Survival timeout only; Classic has no results screen since it's endless) — outcome heading (e.g. final streak or score), "Play again" and "Back to menu" buttons.

## Mode mechanics

- **Classic** (`modes/classic.js`) — shows one headline via `deck.nextEither()` with "Real" / "Satire" buttons. On answer: reveal correct/incorrect plus the true label, update a session tally (`correct / total`), then show a "Next" button. Clicking "Next" loads the next headline. No fail state; plays until "Back to menu" is clicked.

- **Duel** (`modes/duel.js`) — shows two headlines side by side via `deck.nextPair()` as clickable buttons, under the prompt "Which one is real?" On a correct pick, the streak increments and a new pair loads immediately. On a wrong pick, the round ends immediately and the results screen shows the final streak.

- **Survival** (`modes/survival.js`) — starts a visible 30 second countdown, headlines via `deck.nextEither()` with Real/Satire buttons. Correct answers give +1s and increment the score; wrong answers give -3s (score only increases on correct answers). The round ends when the timer hits zero; the results screen shows the final score. No lives system.

All three share the same button style and layout shell from `style.css`; only the score/streak/timer readout and per-round content differ.

## Accessibility

**Labels.** Buttons use short, on-their-own-meaningful text ("Real", "Satire", "Start", "Back to menu", "Play again"). In Duel mode, each headline is itself a `<button>` whose accessible name is the headline text; the "Which one is real?" prompt heading supplies the surrounding context, so no extra `aria-label` is layered on top of it.

**ARIA (minimal, used where it earns its keep).**
- Feedback after each answer (Classic/Survival: "Correct — this was real." / "Incorrect — this was satire.") is announced via an `aria-live="polite"` region, since focus does not move on answer submission (only on advancing to the next question).
- The Survival timer updates visually every second but is not wrapped in a live region (a per-second announcement would be too noisy); the final "time's up" transition to the results screen is what gets announced, via the normal focus-shift to the results heading.
- No other ARIA roles/attributes are introduced beyond native semantics (`<button>`, headings, etc).

**Focus management.** Every screen transition moves focus to a specific element (each target is a heading or button with `tabindex="-1"` where it isn't natively focusable, then `.focus()`'d on transition):
- Menu loads → focus on the menu's `<h1>`.
- Clicking a mode button on the menu → instructions screen shown → focus on that mode's title heading.
- Clicking "Start" → game screen shown → focus on the first question:
  - Classic/Survival: focus on the headline heading.
  - Duel: focus on the **first** of the two headline buttons.
- Submitting an answer (Classic: clicking "Next"; Duel/Survival: clicking an answer, which advances immediately) → focus moves to the next question as soon as it's shown, following the same per-mode target as above.
- Round ends (Duel miss / Survival timeout) → focus moves to the results heading.
- Clicking "Back to menu" (from instructions, game, or results screen) → focus moves to the menu's `<h1>`.
- Clicking "Play again" from results → treated the same as clicking "Start": focus moves to the first question.

## Testing / verification

Manual verification in a browser (no test framework, this is a static page):
1. Open `index.html`, confirm the menu loads with headline data (or shows the error state if a file is missing/renamed to test the failure path).
2. Play each mode end to end: Classic through several rounds, Duel until a loss, Survival until timeout.
3. Verify focus lands on the documented target at each transition using keyboard-only navigation and a screen reader spot check (e.g. NVDA or VoiceOver) for at least one full playthrough of each mode.
4. Confirm no headline is ever mislabeled (spot-check against the source files) and no headline over ~200 characters appears.
