# Most Likely To — browser game design

## Purpose

A browser party game in the style of this repo's `catch-phrase` and `onion-or-not` games. Players enter names, pick a category, then take turns answering "Most likely to..." prompts by tapping the name of whichever player fits. Each tap adds a point to that player; the first player to reach a target score set at the start ends the round.

## Architecture

Plain HTML/CSS/JS. No build step, no framework, no bundler.

```
index.html        entry point, single #app container plus a status live region
index.js           main loop: renders menu, setup, game, and results screens
data.js             loads and exposes shuffled prompt pools per category
dom-utils.js        escapeHtml, focusElement, announce (writes to the status region, auto-clears)
data/
  sfw.json          friend/family/coworker/party prompts, nothing overtly sexual
  nsfw.json         explicit/raunchy prompts
style.css
```

`index.js` owns the `#app` container and drives four screens: menu -> setup -> game -> results. Each screen is a plain render function that replaces `app.innerHTML` and wires up its own event listeners, matching onion-or-not's approach (no per-mode modules are needed here since there's only one game loop, just three prompt sources).

## Data layer (`data.js`)

Two static JSON files, each a flat array of prompt completions (the fixed text "Most likely to..." is rendered separately, not repeated per entry):

```json
["fall asleep during a movie", "forget a best friend's birthday", "..."]
```

- **SFW** category uses `sfw.json` only.
- **NSFW** category uses `nsfw.json` only.
- **Anything Goes** category is not a third file — at runtime, `data.js` concatenates `sfw.json` and `nsfw.json` into one combined pool.

`data.js` exposes a `createPromptPool(category)` that shuffles its source array(s) once and returns a `next()` function pulling one prompt at a time; when the pool is exhausted it reshuffles and continues (same recycling pattern as onion-or-not's `deck`).

Prompt content is adapted from the connectioncards.app and Cosmopolitan "most likely to" lists (paraphrased, not copied verbatim), split by tone into the two files, supplemented with originals — especially for NSFW, per your request.

## Screen flow

1. **Menu** — heading "Most Likely To", three category buttons: SFW, Anything Goes, NSFW.
2. **Setup** — category name in the heading, a multi-line `<textarea>` for player names (one per line), a number input for target score (default 5), "Continue" and "Back" buttons.
   - Continue validates at least 2 non-blank lines after trimming. On failure, an inline error message appears and is announced via the status region; the screen does not advance.
   - Back returns to the menu.
3. **Game** — heading reads "Most likely to... `<prompt>`". Below it, one button per player labeled `"<Name>, <N> point(s)"` reflecting that player's current score. A persistent "Back to menu" button is always present.
   - Clicking a player's button adds 1 point to them. If no one has reached the target score, the next prompt renders immediately (silent advance, no separate point announcement — the updated button label is the only feedback). If a player's score now meets or exceeds the target, the results screen renders instead.
4. **Results** — heading names whichever player reached the target (e.g. "Sarah reached 5 points!"), a final scoreboard listing every player's score, and two buttons: "Play again" (same players, same category, same target score; scores reset and prompts reshuffle, goes straight to a fresh game screen) and "Back to menu".

## Accessibility

**Labels.** Each player button's accessible name is its full label ("Sarah, 3 points"), so a screen reader always announces the current score along with the name — no separate scoreboard markup is needed during play.

**ARIA (minimal).** A single `<div id="status" role="status"></div>` live region (implicit `aria-live="polite"`) is used only for setup validation errors, following catch-phrase's pattern: set the text, then clear it after ~300ms so repeated identical errors still announce.

**Focus management.** Every screen transition moves focus to a specific heading (or button where no heading exists), using `tabindex="-1"` plus `.focus()` where the target isn't natively focusable:
- Menu loads -> focus the menu `<h1>`.
- Clicking a category -> setup screen -> focus the setup heading.
- Clicking "Continue" (valid) -> game screen -> focus the prompt heading.
- Clicking a player button on the game screen -> next prompt renders -> focus moves to the new prompt heading (repeats each turn, same as onion-or-not's Duel mode advancing focus each round).
- A player reaching the target score -> results screen -> focus the results heading.
- Clicking "Back to menu" (from setup, game, or results) -> focus the menu `<h1>`.
- Clicking "Play again" -> treated like a fresh "Continue": focus moves to the first prompt heading.
- A failed "Continue" validation does not move focus away from the setup screen; the error text appears near the textarea and is announced via the status region.

## Testing / verification

Manual verification in a browser (static page, no test framework beyond what already exists in sibling projects):
1. Open `index.html`, confirm the menu loads with all three category buttons.
2. For each category: enter 2+ names, set a small target score (e.g. 2), play through to a results screen, confirm "Play again" resets scores and reshuffles prompts, and confirm "Back to menu" works from setup, game, and results screens.
3. Confirm the Continue validation blocks fewer than 2 names and announces the error.
4. Verify focus lands on the documented target at each transition using keyboard-only navigation and a screen reader spot check (e.g. NVDA or VoiceOver) for at least one full playthrough.
5. Confirm the "Anything Goes" category draws prompts from both `sfw.json` and `nsfw.json`.
