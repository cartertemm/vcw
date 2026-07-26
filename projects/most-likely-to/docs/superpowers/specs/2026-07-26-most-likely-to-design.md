# Most Likely To — browser game design

## Purpose

A browser party game in the style of this repo's `catch-phrase` and `onion-or-not` games. Players enter names, pick a category, then take turns answering "Most likely to..." prompts by tapping the name of whichever player fits. Each tap adds a point to that player; the first player to reach a target score set at the start ends the round.

## Architecture

Plain HTML/CSS/JS. No build step, no framework, no bundler.

```
index.html        entry point, single #app container plus a status live region, install gate
index.js           main loop: renders menu, setup, game, and results screens
data.js             loads and exposes shuffled prompt pools per category
dom-utils.js        escapeHtml, focusElement, announce (writes to the status region, auto-clears)
platform.js         isIOS / isIOSStandalone helpers, copied from catch-phrase's js/platform.js
sw.js                service worker: caches app shell + data for offline use
manifest.json
data/
  sfw.json          friend/family/coworker/party prompts, nothing overtly sexual
  nsfw.json         explicit/raunchy prompts
assets/
  icon-180.png, icon-192.png, icon-512.png
tools/
  make-icons.ps1     generates the three icon sizes, copied/adapted from catch-phrase's tool
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

Both JSON files are loaded via `fetch()` at startup, same as onion-or-not's `data.js`. The menu shows a loading message until both fetches resolve; if either fails, the menu is replaced with a plain error message ("Couldn't load prompts — reload the page.") with no retry logic, since this is a static local fetch.

## Screen flow

1. **Menu** — heading "Most Likely To", three category buttons in this order: SFW, NSFW, Anything Goes.
2. **Setup** — category name in the heading, a multi-line `<textarea>` for player names (one per line), a number input for target score (default 5, minimum 1), "Continue" and "Back" buttons.
   - Continue first trims every line and drops blank ones, then validates the remaining list: at least 2 names, and no two equal after case-folding. It also validates the target score is at least 1 (blank/non-numeric/less-than-1 input is treated as invalid). Any failure shows an inline error message announced via the status region; the screen does not advance. Only one error shows at a time, in that check order.
   - Back returns to the menu.
3. **Game** — heading reads "Most likely to... `<prompt>`". Below it, one button per player labeled `"<Name>, <N> point(s)"` reflecting that player's current score. A persistent "Back to menu" button is always present. There is no cap on the number of players; the textarea can hold as many names as fit.
   - Clicking a player's button adds 1 point to them. Since only one player's score changes per click, at most one player can cross the target on a given click, so there's never a same-turn tie to resolve. If no one has reached the target score, the next prompt renders immediately (silent advance, no separate point announcement — the updated button label is the only feedback; this is a deliberate choice, not an oversight, so a screen reader hears the next prompt but not a per-click "point added" message). If the clicked player's score now meets or exceeds the target, the results screen renders instead.
   - Clicking "Back to menu" opens a native `confirm()` dialog: "Are you sure you would like to quit the current game and go back to the main menu? All progress will be lost". Confirming (OK) discards the in-progress round and returns to the menu; cancelling leaves the game screen exactly as it was, with focus unchanged.
4. **Results** — heading names whichever player reached the target (e.g. "Sarah reached 5 points!"), a final scoreboard listing every player's score sorted highest-to-lowest (ties broken by the order names were entered in setup), and two buttons: "Play again" (same players, same category, same target score; scores reset and prompts reshuffle, goes straight to a fresh game screen) and "Back to menu" (same confirm dialog as the game screen's, since leaving still discards the just-finished round's state rather than letting the player return to it).

## Accessibility

**Labels.** Each player button's accessible name is its full label ("Sarah, 3 points"), so a screen reader always announces the current score along with the name — no separate scoreboard markup is needed during play.

**ARIA (minimal).** A single `<div id="status" role="status"></div>` live region (implicit `aria-live="polite"`) is used only for setup validation errors, following catch-phrase's pattern: set the text, then clear it after ~300ms so repeated identical errors still announce.

**Focus management.** Every screen transition moves focus to a specific heading (or button where no heading exists), using `tabindex="-1"` plus `.focus()` where the target isn't natively focusable:
- Menu loads -> focus the menu `<h1>`.
- Clicking a category -> setup screen -> focus the setup heading.
- Clicking "Continue" (valid) -> game screen -> focus the prompt heading.
- Clicking a player button on the game screen -> next prompt renders -> focus moves to the new prompt heading (repeats each turn, same as onion-or-not's Duel mode advancing focus each round).
- A player reaching the target score -> results screen -> focus the results heading.
- Clicking "Back" on setup -> focus the menu `<h1>`.
- Clicking "Back to menu" on the game or results screen and confirming the quit dialog -> focus the menu `<h1>`. Cancelling the dialog leaves focus wherever it already was.
- Clicking "Play again" -> treated like a fresh "Continue": focus moves to the first prompt heading.
- A failed "Continue" validation does not move focus away from the setup screen; the error text appears near the textarea and is announced via the status region.

## Installation (PWA)

Same installability setup as catch-phrase, copied and adapted (name/theme color/cache list only):

- **`manifest.json`** — name "Most Likely To", `display: standalone`, theme/background colors chosen for this app, references the three icon sizes.
- **`assets/icon-180.png` / `icon-192.png` / `icon-512.png`** — generated by `tools/make-icons.ps1` (adapted from catch-phrase's script: same solid-color-plus-initials approach, using "MLT" as the badge text and this app's theme color).
- **`sw.js`** — a versioned cache (`most-likely-to-v1`) precaching the app shell (`index.html`, `style.css`, the JS modules, `manifest.json`, the icons, and both prompt JSON files), network-first with cache fallback on fetch, same install/activate/fetch handlers as catch-phrase's service worker.
- **`platform.js`** — `isIOS()` / `isIOSStandalone()`, copied verbatim from catch-phrase.
- **`index.html`** — adds the PWA meta tags (viewport, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `theme-color`), `<link rel="manifest">`, `<link rel="icon">`/`apple-touch-icon`, and a hidden `#install-gate` section with the same copy and "Continue anyway" button as catch-phrase's, shown only when `isIOS() && !isIOSStandalone()`.
- **`index.js`** — on startup, calls the same `setupGate()` pattern (reveal the install gate on iOS Safari, otherwise reveal `#app` directly) before registering the service worker (wrapped in the same try/catch for sandboxed-iframe environments) and rendering the menu.
- **`package.json`** — `{ "name": "most-likely-to", "private": true, "type": "module" }`, matching catch-phrase's shape (a `test` script is added once tests exist).

## Testing / verification

Manual verification in a browser (static page, no test framework beyond what already exists in sibling projects):
1. Open `index.html`, confirm the menu loads with all three category buttons.
2. For each category: enter 2+ names, set a small target score (e.g. 2), play through to a results screen, confirm "Play again" resets scores and reshuffles prompts, and confirm "Back to menu" works from setup, game, and results screens.
3. Confirm the Continue validation blocks fewer than 2 names, duplicate names, and an invalid (blank/zero/negative) target score, each announcing an error.
4. Verify focus lands on the documented target at each transition using keyboard-only navigation and a screen reader spot check (e.g. NVDA or VoiceOver) for at least one full playthrough.
5. Confirm the "Anything Goes" category draws prompts from both `sfw.json` and `nsfw.json`.
6. Confirm the menu shows category buttons in the order SFW, NSFW, Anything Goes.
7. Confirm "Back to menu" on the game and results screens shows the confirm dialog, cancelling leaves the current screen untouched, and confirming returns to the menu.
8. Confirm the install gate appears only when simulating iOS Safari (not standalone), and that "Continue anyway" reveals the app; on a non-iOS browser, confirm the app loads directly and the service worker registers (check via devtools Application tab).
