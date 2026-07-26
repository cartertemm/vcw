# Most Likely To Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Most Likely To" browser party game per `docs/superpowers/specs/2026-07-26-most-likely-to-design.md`, matching the plain HTML/CSS/JS, no-build-step conventions of the sibling `catch-phrase` and `onion-or-not` projects in this repo.

**Architecture:** Pure logic (name/target validation, scoring, prompt shuffling) lives in small standalone ES modules with unit tests, mirroring `onion-or-not/dom-utils.js`/`words.js` conventions. `index.js` is the DOM-rendering integration layer (menu → setup → game → results), verified manually rather than unit-tested, matching `onion-or-not/index.js`'s untested status. File layout is flat at the project root, matching the spec's architecture section and `onion-or-not`'s actual layout (not `catch-phrase`'s `js/` subdirectory — an earlier draft of this plan used a `js/` subdirectory without flagging the deviation from the spec; this revision conforms to the spec instead). PWA installability (manifest, service worker, iOS install gate) is copied and adapted from `catch-phrase`.

**Tech Stack:** Vanilla JS (ES modules), `node --test` for unit tests, no build tooling, no npm dependencies. Local manual verification uses a small dependency-free static file server copied from `catch-phrase/tools/serve.mjs`, not `npx http-server`.

---

## File structure

```
index.html
index.js            screen rendering + wiring, manual verification only
data.js              shuffle, createPromptPool, loadPrompts — pure/fetch-injectable, unit tested
dom-utils.js         escapeHtml, focusElement, announce (copied/adapted from onion-or-not + catch-phrase)
platform.js          isIOS / isIOSStandalone (copied verbatim from catch-phrase, untested there too)
validation.js        parsePlayerNames, validateSetup — pure, unit tested
scoring.js           createScoreboard — pure, unit tested
sw.js
manifest.json
style.css
data/
  sfw.json
  nsfw.json
assets/
  icon-180.png, icon-192.png, icon-512.png (generated, not hand-authored)
tools/
  make-icons.ps1
  serve.mjs           dependency-free static file server for manual verification, copied from catch-phrase
package.json
tests/
  validation.test.mjs
  scoring.test.mjs
  data.test.mjs
```

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tools/serve.mjs`

- [ ] **Step 1: Check for an existing root `.gitignore`**

Run: `cat ../../.gitignore 2>/dev/null || echo "none"` (from `projects/most-likely-to`)

If one exists at the repo root and covers general OS/editor cruft, no project-local `.gitignore` is needed.

- [ ] **Step 2: Create `package.json`**

```json
{
	"name": "most-likely-to",
	"private": true,
	"type": "module",
	"scripts": {
		"test": "node --test"
	}
}
```

- [ ] **Step 3: Create `tools/serve.mjs`**

Copied verbatim from `catch-phrase/tools/serve.mjs`, port changed to avoid clashing if both projects are ever served at once.

```js
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = 8124;
const TYPES = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
};
const root = process.cwd();

http.createServer(async (req, res) => {
	const requestedPath = req.url.split('?')[0];
	const path = requestedPath === '/' ? '/index.html' : requestedPath;
	try {
		const file = await readFile(join(root, normalize(decodeURIComponent(path))));
		res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
		res.end(file);
	} catch {
		res.writeHead(404);
		res.end('not found');
	}
}).listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
```

- [ ] **Step 4: Commit**

```bash
git add package.json tools/serve.mjs
git commit -m "Scaffold most-likely-to package.json and dev server"
```

---

### Task 2: `dom-utils.js`

**Files:**
- Create: `dom-utils.js`

No unit tests for this file — `escapeHtml`/`focusElement` touch the DOM and aren't unit-tested in either sibling project (`onion-or-not/dom-utils.js` has no corresponding test file); `announce`'s timer-based clearing is the same story. Verified manually in Task 15.

`escapeHtml` is only ever used for text-node content (inside `<h2>...</h2>`, `<li>...</li>`, etc.), never inside an HTML attribute — it escapes `&`, `<`, `>` but not `"`, so interpolating its output into a quoted attribute would be unsafe. Task 14 builds the one place that needs a data attribute derived from user input (`data-player`) via DOM properties instead of string templating, specifically to avoid that trap.

- [ ] **Step 1: Write `dom-utils.js`**

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

let clearAnnounceTimer = null;

export function announce(statusEl, text) {
	clearTimeout(clearAnnounceTimer);
	statusEl.textContent = text;
	clearAnnounceTimer = setTimeout(() => {
		statusEl.textContent = "";
	}, 300);
}
```

- [ ] **Step 2: Commit**

```bash
git add dom-utils.js
git commit -m "Add dom-utils.js"
```

---

### Task 3: `platform.js`

**Files:**
- Create: `platform.js`

Copied verbatim from `catch-phrase/js/platform.js`, which also has no unit test (UA sniffing, not worth mocking `navigator.userAgent` for). Verified manually in Task 15 (install gate step).

- [ ] **Step 1: Write `platform.js`**

```js
export function isIOS() {
	const ua = navigator.userAgent || '';
	if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return true;
	// iPadOS 13+ reports as Macintosh with multi-touch support.
	if (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1) return true;
	return false;
}

export function isIOSStandalone() {
	return isIOS() && window.navigator.standalone === true;
}
```

- [ ] **Step 2: Commit**

```bash
git add platform.js
git commit -m "Add platform.js"
```

---

### Task 4: `validation.js`

**Files:**
- Create: `validation.js`
- Test: `tests/validation.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { parsePlayerNames, validateSetup } from "../validation.js";

test("parsePlayerNames trims lines and drops blank ones", () => {
	assert.deepEqual(
		parsePlayerNames("  Sarah \n\nMike\n   \nJo "),
		["Sarah", "Mike", "Jo"]
	);
});

test("validateSetup rejects fewer than 2 names", () => {
	const result = validateSetup("Sarah", "5");
	assert.equal(result.valid, false);
	assert.equal(result.error, "Enter at least 2 player names.");
});

test("validateSetup rejects duplicate names case-insensitively", () => {
	const result = validateSetup("Sarah\nsarah", "5");
	assert.equal(result.valid, false);
	assert.equal(result.error, "Player names must be unique.");
});

test("validateSetup checks name count before duplicates", () => {
	const result = validateSetup("Sarah", "5");
	assert.equal(result.error, "Enter at least 2 player names.");
});

test("validateSetup rejects a target score below 1", () => {
	for (const bad of ["0", "-3", "", "abc"]) {
		const result = validateSetup("Sarah\nMike", bad);
		assert.equal(result.valid, false);
		assert.equal(result.error, "Target score must be at least 1.");
	}
});

test("validateSetup checks names before target score", () => {
	const result = validateSetup("Sarah", "0");
	assert.equal(result.error, "Enter at least 2 player names.");
});

test("validateSetup accepts valid input", () => {
	const result = validateSetup("Sarah\nMike\nJo", "5");
	assert.deepEqual(result, {
		valid: true,
		names: ["Sarah", "Mike", "Jo"],
		targetScore: 5,
	});
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test` (from `projects/most-likely-to`)
Expected: FAIL — `Cannot find module '../validation.js'`

- [ ] **Step 3: Write `validation.js`**

```js
export function parsePlayerNames(rawText) {
	return rawText
		.split("\n")
		.map(line => line.trim())
		.filter(line => line.length > 0);
}

export function validateSetup(rawNamesText, rawTargetScore) {
	const names = parsePlayerNames(rawNamesText);

	if (names.length < 2) {
		return { valid: false, error: "Enter at least 2 player names." };
	}

	const seen = new Set();
	for (const name of names) {
		const key = name.toLowerCase();
		if (seen.has(key)) {
			return { valid: false, error: "Player names must be unique." };
		}
		seen.add(key);
	}

	const targetScore = Number(rawTargetScore);
	if (!Number.isFinite(targetScore) || targetScore < 1) {
		return { valid: false, error: "Target score must be at least 1." };
	}

	return { valid: true, names, targetScore };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add validation.js tests/validation.test.mjs
git commit -m "Add setup validation logic with tests"
```

---

### Task 5: `scoring.js`

**Files:**
- Create: `scoring.js`
- Test: `tests/scoring.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createScoreboard } from "../scoring.js";

test("addPoint increments only the named player", () => {
	const board = createScoreboard(["Sarah", "Mike"]);
	board.addPoint("Sarah");
	assert.equal(board.getScore("Sarah"), 1);
	assert.equal(board.getScore("Mike"), 0);
});

test("getWinner returns null before anyone reaches the target", () => {
	const board = createScoreboard(["Sarah", "Mike"]);
	board.addPoint("Sarah");
	assert.equal(board.getWinner(2), null);
});

test("getWinner returns the player who reached the target", () => {
	const board = createScoreboard(["Sarah", "Mike"]);
	board.addPoint("Sarah");
	board.addPoint("Sarah");
	assert.equal(board.getWinner(2), "Sarah");
});

test("sortedEntries sorts descending by score, ties keep input order", () => {
	const board = createScoreboard(["Sarah", "Mike", "Jo"]);
	board.addPoint("Jo");
	board.addPoint("Jo");
	board.addPoint("Sarah");
	assert.deepEqual(board.sortedEntries(), [
		{ name: "Jo", score: 2 },
		{ name: "Sarah", score: 1 },
		{ name: "Mike", score: 0 },
	]);
});

test("sortedEntries keeps setup order for players tied at the same score", () => {
	const board = createScoreboard(["Sarah", "Mike", "Jo"]);
	assert.deepEqual(board.sortedEntries(), [
		{ name: "Sarah", score: 0 },
		{ name: "Mike", score: 0 },
		{ name: "Jo", score: 0 },
	]);
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../scoring.js'`

- [ ] **Step 3: Write `scoring.js`**

```js
export function createScoreboard(names) {
	const scores = new Map(names.map(name => [name, 0]));

	return {
		addPoint(name) {
			scores.set(name, scores.get(name) + 1);
		},
		getScore(name) {
			return scores.get(name);
		},
		getWinner(targetScore) {
			return names.find(name => scores.get(name) >= targetScore) ?? null;
		},
		sortedEntries() {
			// Array.prototype.sort is stable, so equal scores keep `names` order.
			return names
				.map(name => ({ name, score: scores.get(name) }))
				.sort((a, b) => b.score - a.score);
		},
	};
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add scoring.js tests/scoring.test.mjs
git commit -m "Add scoreboard logic with tests"
```

---

### Task 6: `data.js`

**Files:**
- Create: `data.js`
- Test: `tests/data.test.mjs`

Note on the mock in Step 1: matching on `url.includes("sfw")` is wrong because `"data/nsfw.json".includes("sfw")` is also `true` ("nsfw" contains "sfw" as a substring) — both fetches would hit the same branch. The mock below matches on the exact URL instead.

- [ ] **Step 1: Write the failing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { shuffle, createPromptPool, loadPrompts } from "../data.js";

test("shuffle returns the same elements in some order", () => {
	const result = shuffle(["a", "b", "c"], () => 0.5);
	assert.deepEqual([...result].sort(), ["a", "b", "c"]);
});

test("createPromptPool draws every prompt once before repeating", () => {
	const pool = createPromptPool(["a", "b", "c"], () => 0.5);
	const drawn = [pool.next(), pool.next(), pool.next()];
	assert.deepEqual([...drawn].sort(), ["a", "b", "c"]);
});

test("createPromptPool reshuffles and keeps drawing after exhaustion", () => {
	const pool = createPromptPool(["a", "b"], () => 0.5);
	pool.next();
	pool.next();
	assert.ok(["a", "b"].includes(pool.next()));
});

test("loadPrompts returns sfw, nsfw, and their concatenation as anythingGoes", async () => {
	const fetchFn = async (url) => {
		if (url === "data/sfw.json") return { ok: true, json: async () => ["s1", "s2"] };
		if (url === "data/nsfw.json") return { ok: true, json: async () => ["n1"] };
		throw new Error(`unexpected url: ${url}`);
	};
	const { sfw, nsfw, anythingGoes } = await loadPrompts(fetchFn);
	assert.deepEqual(sfw, ["s1", "s2"]);
	assert.deepEqual(nsfw, ["n1"]);
	assert.deepEqual(anythingGoes, ["s1", "s2", "n1"]);
});

test("loadPrompts throws if either fetch fails", async () => {
	const fetchFn = async (url) => ({ ok: url !== "data/nsfw.json", json: async () => [] });
	await assert.rejects(() => loadPrompts(fetchFn));
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../data.js'`

- [ ] **Step 3: Write `data.js`**

```js
export function shuffle(list, randomFn = Math.random) {
	const result = list.slice();
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(randomFn() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function createPromptPool(prompts, randomFn = Math.random) {
	let pool = shuffle(prompts, randomFn);
	let index = 0;
	return {
		next() {
			if (index >= pool.length) {
				pool = shuffle(prompts, randomFn);
				index = 0;
			}
			return pool[index++];
		},
	};
}

export async function loadPrompts(fetchFn = fetch) {
	const [sfwRes, nsfwRes] = await Promise.all([
		fetchFn("data/sfw.json"),
		fetchFn("data/nsfw.json"),
	]);
	if (!sfwRes.ok || !nsfwRes.ok) {
		throw new Error("Failed to load prompts");
	}
	const sfw = await sfwRes.json();
	const nsfw = await nsfwRes.json();
	return { sfw, nsfw, anythingGoes: [...sfw, ...nsfw] };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add data.js tests/data.test.mjs
git commit -m "Add prompt pool and loading logic with tests"
```

---

### Task 7: `data/sfw.json`

**Files:**
- Create: `data/sfw.json`

Content adapted (paraphrased, not copied verbatim) from the connectioncards.app and Cosmopolitan "most likely to" lists gathered during brainstorming, restricted to non-sexual content.

- [ ] **Step 1: Write `data/sfw.json`**

```json
[
	"forget a close friend's birthday",
	"believe in star signs",
	"become a millionaire",
	"have a wardrobe malfunction in public",
	"never get married",
	"have the highest phone screen time in the group",
	"move to another country on a whim",
	"end up performing on Broadway",
	"accidentally join a cult",
	"get too excited at the pre-game and regret it later",
	"get asked to leave a club for dancing too hard",
	"star in their own reality show",
	"become a full-time influencer",
	"still be using a flip phone in ten years",
	"own a selfie stick unironically",
	"secretly have the most money saved up",
	"give someone food poisoning with good intentions",
	"take a week to reply to a text",
	"give a tourist hilariously wrong directions on purpose",
	"ask for advice and then completely ignore it",
	"be a no-show at their own wedding",
	"cancel plans at the very last minute",
	"have watched the most shows on a streaming service",
	"be the first one gone in a horror movie",
	"get compared to a celebrity constantly",
	"become a TikTok star overnight",
	"end up in jail for something ridiculous",
	"have the most kids",
	"have the most contacts saved in their phone",
	"always buy the best gifts",
	"go viral for the wrong reasons",
	"prank call someone right now",
	"get married more than once",
	"cry over a video made by total strangers",
	"get carsick on a five minute drive",
	"give the best advice out of everyone here",
	"get lost without GPS",
	"have read the most books this year",
	"have had the best grades in school",
	"become a CEO",
	"win a Nobel Prize",
	"write a bestselling novel",
	"run for president someday",
	"fake being sick to get out of something",
	"drop everything and travel the world",
	"be late to their own party",
	"get a promotion before anyone else here",
	"dress inappropriately for a work meeting",
	"nail a presentation with zero prep",
	"have the messiest car",
	"still be friends with everyone from childhood",
	"get the whole group lost on a hike",
	"forget where they parked",
	"fall asleep during a movie",
	"show up to a costume party in the wrong costume",
	"win a hot dog eating contest",
	"laugh at the most inappropriate moment",
	"get stuck talking to the most boring person at a party",
	"be the last one on the dance floor",
	"start karaoke before anyone asks"
]
```

- [ ] **Step 2: Commit**

```bash
git add data/sfw.json
git commit -m "Add SFW prompt list"
```

---

### Task 8: `data/nsfw.json`

**Files:**
- Create: `data/nsfw.json`

Content adapted from Cosmopolitan's "Juiciest" section plus originals, per your explicit request for original NSFW content.

- [ ] **Step 1: Write `data/nsfw.json`**

```json
[
	"have a threesome",
	"get caught having sex in public",
	"sleep with their ex again",
	"forget someone's name during sex",
	"have a one-night stand with a total stranger",
	"lie to their friends about a hookup",
	"marry someone they just met in Vegas",
	"sleep with a friend's sibling",
	"fake their own death to get out of a bad date",
	"give someone a fake number to escape a bar",
	"have sex outdoors somewhere risky",
	"go skinny dipping on a first date",
	"secretly have a foot fetish",
	"forget the name of someone they hooked up with",
	"make a homemade sex tape",
	"marry for money",
	"be way too into roleplay",
	"join the mile high club",
	"sleep with a coworker",
	"flirt shamelessly with their boss to get ahead",
	"have an affair and somehow get away with it",
	"send a risky text to the wrong person",
	"have a secret adults-only social media account",
	"get a wild tattoo they regret after a hookup",
	"hook up with someone within 24 hours of meeting them",
	"sneak out of a hookup's place before sunrise",
	"have the most convincing fake moan",
	"bring a hookup home while their roommate is still awake",
	"use a cheesy pickup line unironically and have it work",
	"get caught sexting at the worst possible moment",
	"have the wildest story from a dating app",
	"end up in a situationship that lasts way too long",
	"have a \"type\" that's exactly the same person over and over",
	"accidentally match with a friend's ex online",
	"have the most unhinged bedroom playlist",
	"get way too competitive about being \"the best\" in bed",
	"ghost someone right after a great first date",
	"have a secret hookup buddy nobody knows about",
	"bring up an ex during a new relationship at the worst possible time",
	"get caught staring a little too long at someone at the gym"
]
```

- [ ] **Step 2: Commit**

```bash
git add data/nsfw.json
git commit -m "Add NSFW prompt list"
```

---

### Task 9: `index.html`

**Files:**
- Create: `index.html`

Structure adapted from `catch-phrase/index.html` (PWA meta tags, install gate) and `onion-or-not/index.html` (single `#app` container the JS fully re-renders). The `#status` live region is a sibling of `#app`, not inside it — `#app.innerHTML` gets replaced wholesale on every screen change, so a status node living inside it would be destroyed and re-created each time, breaking the persistent timer reference in `announce()`.

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="theme-color" content="#7c2d92">
	<title>Most Likely To</title>
	<link rel="manifest" href="manifest.json">
	<link rel="icon" href="assets/icon-192.png">
	<link rel="apple-touch-icon" href="assets/icon-180.png">
	<link rel="stylesheet" href="style.css">
</head>
<body>
	<section id="install-gate" hidden>
		<h1>Install for the best experience</h1>
		<p>It looks like this site is being visited in your browser. Playing often? Add it to your home screen so it's one tap away. The in-browser experience has address-bar clutter and inconsistent gesture handling with VoiceOver.</p>
		<p>To install: tap the More button followed by the Share button in the Safari toolbar, then choose View More followed by Add to Home Screen. Launch the site from your home screen and it will run full-screen, like a native app.</p>
		<button type="button" id="continue-anyway">Continue anyway</button>
	</section>
	<main id="app" hidden></main>
	<div id="status" role="status"></div>
	<script type="module" src="index.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "Add index.html"
```

---

### Task 10: `style.css`

**Files:**
- Create: `style.css`

Adapted from `onion-or-not/style.css`.

- [ ] **Step 1: Write `style.css`**

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

textarea, input[type="number"] {
	font-size: 1rem;
	display: block;
	margin: 0.5rem 0 1rem;
}

textarea {
	width: 100%;
	box-sizing: border-box;
}

label {
	display: block;
	margin-top: 0.75rem;
	font-weight: bold;
}

.error {
	color: #b00020;
}

h1, h2 {
	outline: none;
}

h1:focus-visible, h2:focus-visible {
	outline: 2px solid #7c2d92;
	outline-offset: 2px;
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "Add style.css"
```

---

### Task 11: `manifest.json`

**Files:**
- Create: `manifest.json`

- [ ] **Step 1: Write `manifest.json`**

```json
{
	"name": "Most Likely To",
	"short_name": "Most Likely To",
	"start_url": ".",
	"display": "standalone",
	"background_color": "#1a0b2e",
	"theme_color": "#7c2d92",
	"icons": [
		{ "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
		{ "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png" }
	]
}
```

- [ ] **Step 2: Commit**

```bash
git add manifest.json
git commit -m "Add manifest.json"
```

---

### Task 12: Icons

**Files:**
- Create: `tools/make-icons.ps1`
- Create (generated, don't hand-author): `assets/icon-180.png`, `assets/icon-192.png`, `assets/icon-512.png`

Adapted from `catch-phrase/tools/make-icons.ps1`: same solid-color-plus-initials approach, "MLT" instead of "CP", theme color `#7c2d92`.

- [ ] **Step 1: Write `tools/make-icons.ps1`**

```powershell
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $projectRoot 'assets'
New-Item -ItemType Directory -Force $assets | Out-Null
foreach ($size in @(180, 192, 512)) {
	$bmp = New-Object System.Drawing.Bitmap($size, $size)
	$g = [System.Drawing.Graphics]::FromImage($bmp)
	$g.SmoothingMode = 'AntiAlias'
	$g.TextRenderingHint = 'AntiAlias'
	$g.Clear([System.Drawing.Color]::FromArgb(255, 124, 45, 146))
	$font = New-Object System.Drawing.Font('Segoe UI', [int]($size * 0.30), [System.Drawing.FontStyle]::Bold)
	$format = New-Object System.Drawing.StringFormat
	$format.Alignment = 'Center'
	$format.LineAlignment = 'Center'
	$rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
	$g.DrawString('MLT', $font, [System.Drawing.Brushes]::White, $rect, $format)
	$g.Dispose()
	$bmp.Save((Join-Path $assets "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
	$bmp.Dispose()
}
Write-Output 'Icons written to assets/'
```

- [ ] **Step 2: Run it to generate the icons**

Run (PowerShell, from `projects/most-likely-to`): `pwsh tools/make-icons.ps1` (or `powershell tools/make-icons.ps1` on Windows PowerShell 5.1)
Expected: `Icons written to assets/` and the three PNG files exist under `assets/`.

- [ ] **Step 3: Commit**

```bash
git add tools/make-icons.ps1 assets/icon-180.png assets/icon-192.png assets/icon-512.png
git commit -m "Add icon generation script and generated icons"
```

---

### Task 13: `sw.js`

**Files:**
- Create: `sw.js`

Adapted from `catch-phrase/sw.js` with this project's own asset list and a fresh cache name.

- [ ] **Step 1: Write `sw.js`**

```js
const CACHE_NAME = 'most-likely-to-v1';
const ASSETS = [
	'.',
	'index.html',
	'style.css',
	'dom-utils.js',
	'platform.js',
	'validation.js',
	'scoring.js',
	'data.js',
	'index.js',
	'data/sfw.json',
	'data/nsfw.json',
	'manifest.json',
	'assets/icon-180.png',
	'assets/icon-192.png',
	'assets/icon-512.png',
];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				const copy = response.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
				return response;
			})
			.catch(() => caches.match(event.request))
	);
});
```

- [ ] **Step 2: Commit**

```bash
git add sw.js
git commit -m "Add service worker"
```

---

### Task 14: `index.js` — full screen wiring

**Files:**
- Create: `index.js`

This is the DOM integration layer: install gate, service worker registration, and the menu → setup → game → results screen flow from the spec. Not unit-tested (matches `onion-or-not/index.js`'s untested status) — verified manually in Task 15.

Two details worth calling out before writing the code:
- **Player buttons are built with `document.createElement`, not string-templated HTML.** `escapeHtml` only escapes `&`/`<`/`>` (it's designed for text-node content, not attributes), so interpolating a player name into a `data-player="..."` string would let a name containing `"` break out of the attribute and corrupt the markup. Setting `.dataset.player` as a property, and the label via `.textContent`, sidesteps this entirely — no escaping needed because there's no HTML parsing step for user data.
- **`renderSetup` preserves whatever was typed when validation fails**, by threading the raw textarea/number-input text back in and setting `.value` on re-render, so a failed Continue doesn't force retyping every name.

- [ ] **Step 1: Write `index.js`**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add index.js
git commit -m "Add index.js screen flow and PWA wiring"
```

---

### Task 15: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite one more time**

Run: `npm test`
Expected: PASS (all tests from Tasks 4–6)

- [ ] **Step 2: Serve the app locally and open it in a browser**

Run (from `projects/most-likely-to`): `node tools/serve.mjs`
Open `http://localhost:8124` in a browser.

- [ ] **Step 3: Confirm the menu**

Menu loads, focus lands on the "Most Likely To" heading, category buttons appear in order SFW, NSFW, Anything Goes.

- [ ] **Step 4: Play a full round in each category**

For each of SFW, NSFW, Anything Goes: enter 2+ names, set target score to 2, click through several prompts, confirm scores update in the button labels, reach the results screen, confirm the scoreboard is sorted highest-to-lowest, click "Play again" and confirm scores reset with a fresh prompt.

- [ ] **Step 5: Confirm setup validation, including that entered text survives a failed Continue**

On the setup screen: try fewer than 2 names, duplicate names (any case), and an invalid target score (blank, 0, negative, non-numeric) — each should show an inline error and announce it, without advancing, and without clearing the names/target score already typed in.

- [ ] **Step 6: Confirm the quit-confirmation dialog**

From the game screen and the results screen, click "Back to menu": confirm the native dialog reads "Are you sure you would like to quit the current game and go back to the main menu? All progress will be lost", Cancel leaves the screen untouched, and OK returns to the menu.

- [ ] **Step 7: Confirm focus management**

Using keyboard-only navigation, confirm focus lands on the documented heading at each transition (menu → setup → game → next prompt → results → menu). Spot-check with a screen reader (NVDA or VoiceOver) for one full playthrough.

- [ ] **Step 8: Confirm the "Anything Goes" pool is combined**

Play several rounds of Anything Goes and confirm prompts from both the SFW and NSFW lists appear.

- [ ] **Step 9: Confirm the install gate (iOS simulation)**

In Chrome DevTools, use device emulation for an iPhone (which spoofs the iOS user agent) and reload: confirm the install gate appears with focus on "Continue anyway", and clicking it reveals the app. Reload without emulation and confirm the app loads directly with no gate.

- [ ] **Step 10: Confirm the service worker registers**

In DevTools → Application → Service Workers, confirm `sw.js` is registered and activated for this origin.

- [ ] **Step 11: Commit any fixes found during manual verification**

If any step above surfaces a bug, fix it, re-run the relevant checks, and commit with a message describing the fix.
