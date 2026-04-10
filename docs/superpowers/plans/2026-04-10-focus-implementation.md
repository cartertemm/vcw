# Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `projects/focus/index.html`, a single-file brainwave entrainment and soundscape sculpting app, per `docs/superpowers/specs/2026-04-10-focus-design.md`.

**Architecture:** One `index.html` with embedded CSS and JavaScript. One `AudioEngine` object owning a Web Audio node graph (noise source through a 10-band peaking-filter chain, optional entrainment oscillators routed through a StereoPanner and gain stage, optional soundscape buffer source). One `PRESETS` data array. A UI layer that wires DOM events, owns the session timer, and reads/writes `localStorage` via two helper functions. Six seamless-loop `.ogg` files in `projects/focus/assets/`.

**Tech Stack:** Plain HTML5, vanilla JavaScript (no framework, no build), Web Audio API, `<dialog>` and `<details>` elements, `localStorage`. Assets: CC0-licensed `.ogg` loops from freesound.org.

## Working rules (enforced throughout)

These are hard constraints from the user, not guidelines. Every task inherits them.

**Minimum code.** No speculative features, no unrequested configurability, no abstractions for single-use code, no error handling for impossible scenarios. If a step's code feels padded, compress it. Senior-engineer test: would this be called overcomplicated? If yes, simplify.

**Verifiable success criteria.** Every task ends with a concrete check that must actually pass before moving on. No "looks good," no "should work." Evidence before assertions.

## Spec interpretations locked in

Two small ambiguities were resolved before task breakdown. If either is wrong, correct during plan review.

1. **Noise color.** The spec enumerates four colors (white, pink, brown, grey) as engine capabilities but does not define a UI control for picking one. v1 ships **pink noise only** (via Paul Kellet's economical filter approximation). The other three colors are not generated and not implemented. Cutting them follows the minimum-code rule.
2. **EQ curve seed values.** The spec defines four named curves (`neutral`, `warm`, `bright`, `dark`) as initial 10-band gain arrays but leaves the actual numbers to implementation. Values are chosen with reasonable defaults in Task 3, not tuned against research.
3. **`rampTargetHz` signature.** The spec sketches `rampTargetHz(toHz, durationSec)`. The implementation uses `rampTargetHz(fromHz, toHz, durationSec)` because the ramp needs an explicit starting frequency — otherwise it would have to read the oscillator's current value, which is brittle. The 3-arg form is a strict improvement and does not change user-facing behavior.

## Testing model

This project has no automated test runner. The sibling VCW projects don't use one, and adding Jest or Vitest for a single static HTML file violates both VCW conventions and the minimum-code rule. Each task defines a **concrete manual verification step** — what to do and what to observe — which serves as the acceptance check.

Pure, deterministic helpers (pink noise generation, macro-to-band curve math) get **inline assertions** inside a small `projects/focus/sanity-check.html` harness that runs a handful of `console.assert` calls on page load. That file is removed at the end of the project (Task 16) — it exists only as a dev sanity net, not a shipped artifact.

The spec's 13 success criteria are the final acceptance gate and are re-run in Task 16.

## File structure

```
projects/focus/
├── index.html          # all markup, CSS, and JS for the app
├── README.md           # brief description + credits pointer
├── sanity-check.html   # TEMPORARY: inline assertions for pure helpers (deleted at end)
└── assets/
    ├── rain.ogg
    ├── ocean.ogg
    ├── forest-wind.ogg
    ├── fire.ogg
    ├── thunder.ogg
    └── cafe.ogg
```

Inside `index.html`, the script block is laid out in this order:

1. `PRESETS` constant
2. `BAND_LABELS` constant (descriptive names for the 10 EQ bands)
3. `EQ_CURVES` constant (four named 10-element arrays)
4. `loadState()` / `saveState()` helpers
5. `AudioEngine` object literal
6. UI wiring (DOMContentLoaded handler that queries elements, binds events, renders initial state)

No ES modules, no bundler, no import statements. One `<script>` tag at the end of `<body>`.

## Commit policy

Commit after every task. Commit messages follow the repo's existing style (present-tense imperative, one or two sentences, no Co-authored-by lines). Stage only the files the task touched. Do not use `git add -A` or `git add .`.

---

## Task 1: Scaffold project directory and README

**Files:**
- Create: `projects/focus/index.html`
- Create: `projects/focus/README.md`
- Create: `projects/focus/assets/` (directory only)

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p projects/focus/assets
```

- [ ] **Step 2: Write a minimal index.html shell**

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Focus</title>
	<style>
		*, *::before, *::after { box-sizing: border-box; }
		body {
			font-family: system-ui, -apple-system, sans-serif;
			max-width: 720px;
			margin: 2rem auto;
			padding: 0 1rem;
			background: #1a1a2e;
			color: #e0e0e0;
			line-height: 1.5;
		}
		h1 { color: #e94560; }
		:focus-visible { outline: 2px solid #e94560; outline-offset: 2px; }
	</style>
</head>
<body>
	<h1>Focus</h1>
	<p>Brainwave entrainment and soundscape sculpting.</p>
	<script>
		// audio engine, presets, UI wiring — added incrementally
	</script>
</body>
</html>
```

- [ ] **Step 3: Write the README**

```markdown
# Focus

Brainwave entrainment and soundscape sculpting. A single-file, zero-dependency web app inspired by mynoise.net.

Pick a goal (Creativity, Flow, Focus, Productivity, Relaxation, Sleep), choose an entrainment technique (binaural, monaural, isochronic, or none), and shape the noise bed with a 10-band equalizer. Optional timer and frequency ramp.

Open `index.html` in any modern browser. No build step, no installation. Headphones recommended for binaural beats.

See the Credits dialog inside the app for soundscape attribution.
```

- [ ] **Step 4: Verify**

Open `projects/focus/index.html` in a browser. Expected: dark page with red "Focus" heading, a tagline, no console errors.

- [ ] **Step 5: Commit**

```bash
git add projects/focus/index.html projects/focus/README.md
git commit -m "Scaffold Focus project with minimal HTML shell and README"
```

---

## Task 2: Static markup and CSS layout

Build the full visible page structure. Nothing is wired up yet — every control renders, but clicking Begin does nothing and the sliders are inert. Layout must match the spec's UI section.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Add the header and modal placeholders to the `<body>`**

Replace the placeholder `<h1>` and `<p>` with:

```html
<header>
	<h1>Focus</h1>
	<nav>
		<button type="button" id="about-btn">About</button>
		<button type="button" id="credits-btn">Credits</button>
	</nav>
</header>

<section id="preset-strip" role="radiogroup" aria-label="Goal presets">
	<!-- six preset buttons rendered by JS in Task 3 -->
</section>

<section id="now-playing" aria-label="Now playing">
	<div id="first-run-panel" hidden></div>
	<p id="np-summary">Preset: <span id="np-preset">Focus</span> · Frequency: <span id="np-hz">14.0</span> Hz</p>
	<div class="transport">
		<button type="button" id="begin-btn" aria-pressed="false">Begin session</button>
		<label>Volume <input type="range" id="volume" min="0" max="100" value="70" aria-valuetext="70 percent"></label>
	</div>
	<p id="live-region" aria-live="polite" class="visually-hidden"></p>

	<details id="customize">
		<summary>Customize</summary>

		<fieldset>
			<legend>Technique</legend>
			<label><input type="radio" name="technique" value="binaural"> Binaural (headphones)</label>
			<label><input type="radio" name="technique" value="monaural"> Monaural</label>
			<label><input type="radio" name="technique" value="isochronic"> Isochronic</label>
			<label><input type="radio" name="technique" value="none"> Soundscape only</label>
		</fieldset>

		<label>Target frequency
			<input type="range" id="target-hz" min="0.5" max="45" step="0.1" value="14">
			<span id="target-hz-readout">14.0 Hz</span>
		</label>

		<label>Soundscape
			<select id="soundscape">
				<option value="none">None</option>
				<option value="rain">Rain</option>
				<option value="ocean">Ocean</option>
				<option value="forest-wind">Forest wind</option>
				<option value="fire">Fire</option>
				<option value="thunder">Thunder</option>
				<option value="cafe">Cafe</option>
			</select>
			<span id="soundscape-loading" hidden aria-live="polite">Loading…</span>
		</label>

		<label>Timer
			<select id="timer">
				<option value="0">Off</option>
				<option value="600">10 minutes</option>
				<option value="1200">20 minutes</option>
				<option value="2700">45 minutes</option>
				<option value="5400">90 minutes</option>
			</select>
		</label>

		<label>Frequency ramp
			<input type="range" id="ramp" min="0" max="15" step="1" value="0">
			<span id="ramp-readout">Off</span>
		</label>

		<fieldset id="macros">
			<legend>Macro sculpting</legend>
			<label>Brightness <input type="range" id="macro-brightness" min="-12" max="12" step="0.5" value="0"></label>
			<label>Warmth <input type="range" id="macro-warmth" min="-12" max="12" step="0.5" value="0"></label>
		</fieldset>

		<fieldset id="bands">
			<legend>Bands</legend>
			<!-- ten band sliders rendered by JS in Task 4 -->
		</fieldset>
	</details>
</section>

<dialog id="about-dialog">
	<h2>About</h2>
	<!-- content added in Task 13 -->
	<form method="dialog"><button type="submit">Close</button></form>
</dialog>

<dialog id="credits-dialog">
	<h2>Credits</h2>
	<!-- content added in Task 14 -->
	<form method="dialog"><button type="submit">Close</button></form>
</dialog>
```

- [ ] **Step 2: Extend the `<style>` block with layout styles**

Add inside the existing `<style>`:

```css
header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
}
header nav { display: flex; gap: 0.5rem; }
button {
	background: #16213e;
	color: #e0e0e0;
	border: 1px solid #0f3460;
	padding: 0.5rem 1rem;
	font: inherit;
	cursor: pointer;
	border-radius: 4px;
}
button[aria-pressed="true"] { background: #e94560; color: white; }
#preset-strip {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;
	margin-bottom: 1rem;
}
#preset-strip button[aria-checked="true"] {
	background: #e94560;
	color: white;
}
#now-playing { background: #16213e; padding: 1rem; border-radius: 8px; }
#np-summary { margin: 0 0 1rem 0; }
.transport { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.transport label { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
.transport input[type="range"] { flex: 1; }
details > summary { cursor: pointer; padding: 0.5rem 0; font-weight: bold; }
fieldset { border: 1px solid #0f3460; border-radius: 4px; margin: 1rem 0; padding: 0.75rem; }
legend { padding: 0 0.5rem; }
fieldset label { display: block; margin: 0.25rem 0; }
#bands label { display: grid; grid-template-columns: 10rem 1fr 3rem; gap: 0.5rem; align-items: center; }
dialog { background: #16213e; color: #e0e0e0; border: 1px solid #0f3460; border-radius: 8px; max-width: 600px; padding: 1.5rem; }
dialog::backdrop { background: rgba(0,0,0,0.6); }
.visually-hidden {
	position: absolute;
	width: 1px; height: 1px;
	padding: 0; margin: -1px;
	overflow: hidden; clip: rect(0, 0, 0, 0);
	white-space: nowrap; border: 0;
}
@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 3: Verify**

Open in browser. Expected:
- Header with "Focus" title and About / Credits buttons
- An empty preset strip area (JS renders buttons later)
- Now Playing card with summary line, Begin button, Volume slider
- A "Customize" disclosure that expands to reveal technique, target freq, soundscape, timer, ramp, macros, and an empty Bands fieldset
- No console errors
- All visible buttons and inputs are focusable with Tab, with a visible focus ring

- [ ] **Step 4: Commit**

```bash
git add projects/focus/index.html
git commit -m "Add static markup and CSS layout for Focus UI"
```

---

## Task 3: Preset data, band labels, and EQ curves

Add the three data constants to the script block. No wiring yet — just the data.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Add the constants to the script block**

```js
const PRESETS = [
	{ id: 'creativity',   name: 'Creativity',   band: 'Theta',      hz: 6.0,  technique: 'binaural',   soundscape: 'forest-wind', eq: 'warm'    },
	{ id: 'flow',         name: 'Flow',         band: 'High Alpha', hz: 10.5, technique: 'monaural',   soundscape: 'ocean',       eq: 'neutral' },
	{ id: 'focus',        name: 'Focus',        band: 'Low Beta',   hz: 14.0, technique: 'isochronic', soundscape: 'rain',        eq: 'neutral' },
	{ id: 'productivity', name: 'Productivity', band: 'Mid Beta',   hz: 18.0, technique: 'isochronic', soundscape: 'cafe',        eq: 'bright'  },
	{ id: 'relaxation',   name: 'Relaxation',   band: 'Low Alpha',  hz:  9.0, technique: 'binaural',   soundscape: 'fire',        eq: 'warm'    },
	{ id: 'sleep',        name: 'Sleep',        band: 'Delta',      hz:  2.5, technique: 'monaural',   soundscape: 'thunder',     eq: 'dark'    },
];

const BAND_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const BAND_LABELS = [
	'Low rumble', 'Sub-bass', 'Bass', 'Low-mids', 'Mids',
	'Upper-mids', 'Presence', 'Brilliance', 'Air', 'Sparkle',
];

// gain in dB for each of the 10 bands; reasonable defaults, not research-tuned
const EQ_CURVES = {
	neutral: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	warm:    [3, 4, 3, 2, 0, -1, -2, -3, -4, -5],
	bright:  [-4, -3, -2, -1, 0, 1, 2, 3, 4, 3],
	dark:    [5, 4, 3, 2, 1, -1, -3, -5, -8, -10],
};
```

- [ ] **Step 2: Verify**

Reload the page. Open the browser devtools console. Type `PRESETS.length`. Expected: `6`. Type `EQ_CURVES.warm.length`. Expected: `10`. Type `BAND_FREQS[5]`. Expected: `1000`.

- [ ] **Step 3: Commit**

```bash
git add projects/focus/index.html
git commit -m "Add PRESETS, BAND_FREQS, BAND_LABELS, and EQ_CURVES data constants"
```

---

## Task 4: Render preset strip and band sliders from data

Now wire the static markup to the data: render the six preset buttons and the ten band sliders dynamically so their labels and default values come from the constants in Task 3.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Add rendering code inside a DOMContentLoaded handler**

Append to the script block:

```js
document.addEventListener('DOMContentLoaded', () => {
	const presetStrip = document.getElementById('preset-strip');
	PRESETS.forEach((p, i) => {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.setAttribute('role', 'radio');
		btn.setAttribute('aria-checked', i === 2 ? 'true' : 'false'); // Focus selected by default
		btn.dataset.presetId = p.id;
		btn.textContent = p.name;
		presetStrip.appendChild(btn);
	});

	const bandsFieldset = document.getElementById('bands');
	BAND_FREQS.forEach((hz, i) => {
		const label = document.createElement('label');
		const name = document.createElement('span');
		const freqText = hz >= 1000 ? `${hz/1000}k Hz` : `${hz} Hz`;
		name.textContent = `${BAND_LABELS[i]} (${freqText})`;
		const input = document.createElement('input');
		input.type = 'range';
		input.min = '-24';
		input.max = '12';
		input.step = '0.5';
		input.value = '0';
		input.id = `band-${i}`;
		input.dataset.bandIndex = String(i);
		input.setAttribute('aria-valuetext', `${BAND_LABELS[i]}: 0 decibels`);
		const readout = document.createElement('span');
		readout.textContent = '0 dB';
		readout.id = `band-${i}-readout`;
		input.addEventListener('input', () => {
			const v = Number(input.value).toFixed(1);
			readout.textContent = `${v} dB`;
			input.setAttribute('aria-valuetext', `${BAND_LABELS[i]}: ${v} decibels`);
		});
		label.appendChild(name);
		label.appendChild(input);
		label.appendChild(readout);
		bandsFieldset.appendChild(label);
	});
});
```

- [ ] **Step 2: Verify**

Reload. Expected:
- Six preset buttons across the preset strip, with Focus highlighted
- Expand Customize; ten band sliders appear, each with a descriptive label, a slider, and a "0 dB" readout
- Dragging a band slider updates its readout live
- Tabbing through the band sliders works and their aria-valuetext updates (verify in devtools Accessibility panel: click the slider, check the "Name"/"Description" attributes show e.g. "Bass: -3 decibels")

- [ ] **Step 3: Commit**

```bash
git add projects/focus/index.html
git commit -m "Render preset strip and 10-band EQ sliders from data"
```

---

## Task 5: Persistence helpers and preset selection

Wire up preset selection: clicking a preset updates Now Playing, seeds Customize controls from the preset data, and persists `lastPresetId` to `localStorage`. Reload restores the last preset.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Add persistence helpers and an applyPreset function**

Add above the DOMContentLoaded handler:

```js
const STATE_KEY = 'focus.state';
function loadState() {
	try {
		return JSON.parse(localStorage.getItem(STATE_KEY)) || {};
	} catch {
		return {};
	}
}
function saveState(patch) {
	const next = { ...loadState(), ...patch };
	localStorage.setItem(STATE_KEY, JSON.stringify(next));
}

function applyPreset(preset) {
	document.getElementById('np-preset').textContent = preset.name;
	document.getElementById('np-hz').textContent = preset.hz.toFixed(1);
	document.getElementById('target-hz').value = String(preset.hz);
	document.getElementById('target-hz-readout').textContent = `${preset.hz.toFixed(1)} Hz`;
	document.querySelector(`input[name="technique"][value="${preset.technique}"]`).checked = true;
	document.getElementById('soundscape').value = preset.soundscape;
	const curve = EQ_CURVES[preset.eq];
	curve.forEach((v, i) => {
		const input = document.getElementById(`band-${i}`);
		input.value = String(v);
		input.dispatchEvent(new Event('input')); // refresh readout and aria-valuetext
	});
}
```

The `try/catch` on `loadState` is intentional: `localStorage.getItem` can return malformed JSON from prior buggy versions, and parsing a string is a genuine external boundary. This is not speculative error handling.

- [ ] **Step 2: Wire preset clicks and initial selection in the DOMContentLoaded handler**

Append inside the DOMContentLoaded callback, after the preset buttons are rendered:

```js
const state = loadState();
const initialPresetId = state.lastPresetId || 'focus';

function selectPreset(presetId) {
	const preset = PRESETS.find(p => p.id === presetId);
	if (!preset) return;
	document.querySelectorAll('#preset-strip button').forEach(b => {
		b.setAttribute('aria-checked', b.dataset.presetId === presetId ? 'true' : 'false');
	});
	applyPreset(preset);
	saveState({ lastPresetId: presetId });
}

presetStrip.querySelectorAll('button').forEach(b => {
	b.addEventListener('click', () => selectPreset(b.dataset.presetId));
});

// Arrow key nav within the radiogroup
presetStrip.addEventListener('keydown', (e) => {
	if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
	e.preventDefault();
	const ids = PRESETS.map(p => p.id);
	const current = document.activeElement?.dataset?.presetId;
	const idx = ids.indexOf(current);
	if (idx === -1) return;
	const delta = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 1;
	const nextIdx = (idx + delta + ids.length) % ids.length;
	const nextBtn = presetStrip.querySelector(`button[data-preset-id="${ids[nextIdx]}"]`);
	nextBtn.focus();
	selectPreset(ids[nextIdx]);
});

selectPreset(initialPresetId);
```

- [ ] **Step 3: Verify**

Reload. Expected:
- Focus is highlighted by default on first load (no prior state)
- Click "Relaxation": the preset highlight moves, Now Playing shows "Preset: Relaxation · Frequency: 9.0 Hz", the technique radio jumps to Binaural, soundscape select jumps to Fire, and the band sliders move to the `warm` curve values
- Reload: Relaxation is still selected (persisted)
- Click into the preset strip, press Right arrow: selection moves to Sleep
- In devtools, check `localStorage.getItem('focus.state')` — it contains a JSON blob with `lastPresetId`

- [ ] **Step 4: Commit**

```bash
git add projects/focus/index.html
git commit -m "Add localStorage persistence and wire preset selection to UI"
```

---

## Task 6: AudioEngine skeleton with AudioContext and master gain

Create the `AudioEngine` object literal. Only the bare graph: an `AudioContext`, a `MasterGain`, and `start()` / `stop()` methods. No sound yet — calling `start()` creates the graph but leaves it silent (no sources connected). The Begin button is wired to toggle between states.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Add the AudioEngine object**

Add above the DOMContentLoaded handler:

```js
const AudioEngine = {
	ctx: null,
	masterGain: null,
	playing: false,

	start() {
		if (this.playing) return;
		if (!this.ctx) {
			this.ctx = new (window.AudioContext || window.webkitAudioContext)();
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.value = 0.7;
			this.masterGain.connect(this.ctx.destination);
		}
		if (this.ctx.state === 'suspended') this.ctx.resume();
		this.playing = true;
	},

	stop() {
		if (!this.playing) return;
		this.playing = false;
	},

	setMasterVolume(v) {
		if (this.masterGain) this.masterGain.gain.value = v;
	},
};
```

- [ ] **Step 2: Wire Begin/Stop button and master volume**

Append inside the DOMContentLoaded callback:

```js
const beginBtn = document.getElementById('begin-btn');
const volume = document.getElementById('volume');

// Restore persisted volume
if (typeof state.masterVolume === 'number') {
	volume.value = String(Math.round(state.masterVolume * 100));
	volume.setAttribute('aria-valuetext', `${volume.value} percent`);
}

function toggleSession() {
	if (AudioEngine.playing) {
		AudioEngine.stop();
		beginBtn.textContent = 'Begin session';
		beginBtn.setAttribute('aria-pressed', 'false');
	} else {
		AudioEngine.start();
		AudioEngine.setMasterVolume(Number(volume.value) / 100);
		beginBtn.textContent = 'Stop session';
		beginBtn.setAttribute('aria-pressed', 'true');
	}
}

beginBtn.addEventListener('click', toggleSession);

volume.addEventListener('input', () => {
	const v = Number(volume.value) / 100;
	AudioEngine.setMasterVolume(v);
	volume.setAttribute('aria-valuetext', `${volume.value} percent`);
	saveState({ masterVolume: v });
});
```

- [ ] **Step 3: Verify**

Reload. Expected:
- Click Begin session. Button text flips to "Stop session", `aria-pressed` becomes `"true"`.
- Open devtools console, type `AudioEngine.ctx`. Expected: an `AudioContext` object.
- Type `AudioEngine.ctx.state`. Expected: `"running"`.
- Click Stop session. Button flips back. `AudioEngine.playing` is false.
- Nothing audible yet — this is expected, no sources are connected.
- Change volume slider. `localStorage` updates; reload preserves the value.

- [ ] **Step 4: Commit**

```bash
git add projects/focus/index.html
git commit -m "Add AudioEngine skeleton with AudioContext and master gain wiring"
```

---

## Task 7: Pink noise source and 10-band EQ filter chain

Add the pink noise source (pre-filled buffer, looping) and the 10-band peaking-filter chain. Expose `setBand(i, gainDb)`. Begin session now produces audible sculpted noise, and dragging a band slider changes the sound in real time.

**Files:**
- Modify: `projects/focus/index.html`
- Create: `projects/focus/sanity-check.html`

- [ ] **Step 1: Create a sanity-check harness for the pink noise function**

Write `projects/focus/sanity-check.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Focus sanity checks</title>
</head>
<body>
	<h1>Focus sanity checks</h1>
	<p>Open the devtools console. Any failing assertion will appear there.</p>
	<script>
		function fillPinkNoise(buffer) {
			const data = buffer.getChannelData(0);
			let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
			for (let i = 0; i < data.length; i++) {
				const white = Math.random() * 2 - 1;
				b0 = 0.99886 * b0 + white * 0.0555179;
				b1 = 0.99332 * b1 + white * 0.0750759;
				b2 = 0.96900 * b2 + white * 0.1538520;
				b3 = 0.86650 * b3 + white * 0.3104856;
				b4 = 0.55000 * b4 + white * 0.5329522;
				b5 = -0.7616 * b5 - white * 0.0168980;
				data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
				b6 = white * 0.115926;
			}
		}

		// run only on user gesture so AudioContext can be created
		document.body.addEventListener('click', () => {
			const ctx = new AudioContext();
			const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
			fillPinkNoise(buf);
			const data = buf.getChannelData(0);
			let min = Infinity, max = -Infinity, sum = 0;
			for (let i = 0; i < data.length; i++) {
				if (data[i] < min) min = data[i];
				if (data[i] > max) max = data[i];
				sum += data[i];
			}
			const mean = sum / data.length;
			console.assert(min >= -1 && max <= 1, 'pink noise out of [-1, 1] range');
			console.assert(Math.abs(mean) < 0.05, 'pink noise mean should be near zero, got ' + mean);
			console.assert(max - min > 0.5, 'pink noise range should be substantial, got ' + (max - min));
			console.log('pink noise sanity check passed', { min, max, mean });
			ctx.close();
		}, { once: true });
	</script>
</body>
</html>
```

- [ ] **Step 2: Verify the sanity check**

Open `projects/focus/sanity-check.html` in a browser. Click anywhere on the page. Expected: console prints `"pink noise sanity check passed"` with a mean near zero and a range near 2. No assertion failures.

- [ ] **Step 3: Extend AudioEngine with noise source and band chain**

Copy `fillPinkNoise` into the main `<script>` in `index.html`, and extend `AudioEngine`:

```js
const BAND_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]; // (already declared in Task 3 — keep one copy)

function fillPinkNoise(buffer) {
	const data = buffer.getChannelData(0);
	let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
	for (let i = 0; i < data.length; i++) {
		const white = Math.random() * 2 - 1;
		b0 = 0.99886 * b0 + white * 0.0555179;
		b1 = 0.99332 * b1 + white * 0.0750759;
		b2 = 0.96900 * b2 + white * 0.1538520;
		b3 = 0.86650 * b3 + white * 0.3104856;
		b4 = 0.55000 * b4 + white * 0.5329522;
		b5 = -0.7616 * b5 - white * 0.0168980;
		data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
		b6 = white * 0.115926;
	}
}
```

Inside `AudioEngine`, add these properties and methods:

```js
noiseSource: null,
bandFilters: null,

_buildNoise() {
	const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
	fillPinkNoise(buf);
	const src = this.ctx.createBufferSource();
	src.buffer = buf;
	src.loop = true;

	const filters = BAND_FREQS.map((hz) => {
		const f = this.ctx.createBiquadFilter();
		f.type = 'peaking';
		f.frequency.value = hz;
		f.Q.value = 1.0;
		f.gain.value = 0;
		return f;
	});

	// chain: src -> filter[0] -> filter[1] -> ... -> filter[9] -> masterGain
	src.connect(filters[0]);
	for (let i = 0; i < filters.length - 1; i++) {
		filters[i].connect(filters[i + 1]);
	}
	filters[filters.length - 1].connect(this.masterGain);
	src.start();

	this.noiseSource = src;
	this.bandFilters = filters;
},

setBand(i, gainDb) {
	if (this.bandFilters) this.bandFilters[i].gain.value = gainDb;
},
```

Update `start()`:

```js
start() {
	if (this.playing) return;
	if (!this.ctx) {
		this.ctx = new (window.AudioContext || window.webkitAudioContext)();
		this.masterGain = this.ctx.createGain();
		this.masterGain.gain.value = 0.7;
		this.masterGain.connect(this.ctx.destination);
	}
	if (this.ctx.state === 'suspended') this.ctx.resume();
	this._buildNoise();
	this.playing = true;
},
```

Update `stop()`:

```js
stop() {
	if (!this.playing) return;
	if (this.noiseSource) {
		this.noiseSource.stop();
		this.noiseSource.disconnect();
		this.noiseSource = null;
	}
	if (this.bandFilters) {
		this.bandFilters.forEach(f => f.disconnect());
		this.bandFilters = null;
	}
	this.playing = false;
},
```

- [ ] **Step 4: Apply EQ curve on Begin and wire band sliders live**

In the `DOMContentLoaded` handler, after the existing `beginBtn.addEventListener('click', toggleSession)` line, add:

```js
// On Begin, apply current band slider values to the engine
const originalToggle = toggleSession;
// (we just extend the existing toggleSession — replace the previous definition)
```

Actually, to avoid replacing code: put the band-apply logic *inside* `toggleSession`. Revise `toggleSession` to:

```js
function toggleSession() {
	if (AudioEngine.playing) {
		AudioEngine.stop();
		beginBtn.textContent = 'Begin session';
		beginBtn.setAttribute('aria-pressed', 'false');
	} else {
		AudioEngine.start();
		AudioEngine.setMasterVolume(Number(volume.value) / 100);
		// push current band slider values into the engine
		for (let i = 0; i < BAND_FREQS.length; i++) {
			AudioEngine.setBand(i, Number(document.getElementById(`band-${i}`).value));
		}
		beginBtn.textContent = 'Stop session';
		beginBtn.setAttribute('aria-pressed', 'true');
	}
}
```

And wire the band sliders for live updates. After the band slider rendering loop, attach a listener:

```js
document.querySelectorAll('#bands input[type="range"]').forEach(input => {
	input.addEventListener('input', () => {
		const i = Number(input.dataset.bandIndex);
		AudioEngine.setBand(i, Number(input.value));
	});
});
```

(The existing listener in Task 4 handles readout and aria-valuetext; this adds an additional listener for the engine. Multiple `input` listeners on the same element are fine.)

- [ ] **Step 5: Verify**

Reload. Click Begin. Expected:
- Audible pink noise from the speakers, shaped by the current preset's EQ curve
- Drag "Bass" slider up: bass gets louder in real time
- Drag "Sparkle" slider down to –24: high end disappears
- Click Stop: silence, no residual tone
- Switch preset to Relaxation while stopped, click Begin: different default EQ shape (warm curve — more bass, less treble)
- Click Stop and Begin several times: no hangs, no errors in console

- [ ] **Step 6: Commit**

```bash
git add projects/focus/index.html projects/focus/sanity-check.html
git commit -m "Add pink noise source and 10-band peaking EQ chain with live band control"
```

---

## Task 8: Macro sliders (Brightness and Warmth)

Add the Brightness and Warmth macro sliders. Moving a macro distributes a curve across the 10 band sliders and updates both the slider values and the engine.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Add macro curves and a helper**

Add above the DOMContentLoaded handler, near the other data constants:

```js
// weights: how much each macro pushes each band. Multiplied by the macro slider value.
const MACRO_CURVES = {
	brightness: [-1.0, -0.8, -0.6, -0.4, -0.2, 0.2, 0.4, 0.6, 0.8, 1.0],
	warmth:     [ 1.0,  0.8,  0.6,  0.4,  0.2, 0.0, -0.2, -0.4, -0.6, -0.8],
};
```

- [ ] **Step 2: Wire the macro sliders**

Inside the DOMContentLoaded handler:

```js
const macroBrightness = document.getElementById('macro-brightness');
const macroWarmth = document.getElementById('macro-warmth');
// bandBase holds the "pre-macro" band values so macros layer additively
let bandBase = EQ_CURVES[PRESETS.find(p => p.id === (state.lastPresetId || 'focus')).eq].slice();

function applyMacros() {
	const b = Number(macroBrightness.value);
	const w = Number(macroWarmth.value);
	for (let i = 0; i < 10; i++) {
		const delta = b * MACRO_CURVES.brightness[i] + w * MACRO_CURVES.warmth[i];
		const next = Math.max(-24, Math.min(12, bandBase[i] + delta));
		const input = document.getElementById(`band-${i}`);
		input.value = String(next);
		input.dispatchEvent(new Event('input'));
	}
}

macroBrightness.addEventListener('input', applyMacros);
macroWarmth.addEventListener('input', applyMacros);

// When a preset is selected, update bandBase and reset macros
// Modify selectPreset to also refresh bandBase:
```

Then replace the body of `selectPreset` with:

```js
function selectPreset(presetId) {
	const preset = PRESETS.find(p => p.id === presetId);
	if (!preset) return;
	document.querySelectorAll('#preset-strip button').forEach(b => {
		b.setAttribute('aria-checked', b.dataset.presetId === presetId ? 'true' : 'false');
	});
	bandBase = EQ_CURVES[preset.eq].slice();
	macroBrightness.value = '0';
	macroWarmth.value = '0';
	applyPreset(preset);
	saveState({ lastPresetId: presetId });
}
```

- [ ] **Step 3: Verify**

Reload. Click Begin. Expected:
- Drag Brightness slider right: high bands visibly move up, low bands move down, audibly the sound gets brighter/thinner
- Drag Brightness back to 0: band sliders return to the preset's curve values
- Drag Warmth right: low bands move up, upper bands down, audibly warmer
- Both macros together: additive — the band sliders show the sum of the deltas
- Pick a different preset: macros reset to 0, bands jump to the new preset's curve

- [ ] **Step 4: Commit**

```bash
git add projects/focus/index.html
git commit -m "Add Brightness and Warmth macro sliders driving band curves"
```

---

## Task 9: Soundscape loader and picker

Add soundscape loading. When the user picks a soundscape (or starts a session with one already selected), the engine fetches the `.ogg`, decodes it, and plays it in a loop alongside the noise bed.

**Files:**
- Modify: `projects/focus/index.html`
- Create: `projects/focus/assets/rain.ogg` (and the other five)

- [ ] **Step 1: Source and add the six audio files**

Download six seamless-loop CC0 samples from freesound.org. Each should be 30–60 seconds, encoded as `.ogg` Vorbis. Save them as `projects/focus/assets/rain.ogg`, `ocean.ogg`, `forest-wind.ogg`, `fire.ogg`, `thunder.ogg`, `cafe.ogg`. Record each sample's freesound URL and author — needed for Task 14 (Credits).

Verification: `ls projects/focus/assets/` shows all six files, each between 0.5 and 2 MB.

If specific samples cannot be found under CC0, use a permissive CC-BY alternative and note the attribution requirement in the Credits modal. Do not use files without clear licensing.

- [ ] **Step 2: Extend AudioEngine with soundscape loading**

Add to `AudioEngine`:

```js
soundscapeBuffer: null,
soundscapeSource: null,
soundscapeGain: null,
soundscapeCache: {},
currentSoundscapeName: null,

async loadSoundscape(name) {
	if (name === 'none') {
		this._stopSoundscape();
		this.currentSoundscapeName = null;
		return;
	}
	if (!this.ctx) return; // only relevant when playing
	let buffer = this.soundscapeCache[name];
	if (!buffer) {
		const res = await fetch(`assets/${name}.ogg`);
		const arr = await res.arrayBuffer();
		buffer = await this.ctx.decodeAudioData(arr);
		this.soundscapeCache[name] = buffer;
	}
	this._stopSoundscape();
	const src = this.ctx.createBufferSource();
	src.buffer = buffer;
	src.loop = true;
	const gain = this.ctx.createGain();
	gain.gain.value = 0.5;
	src.connect(gain).connect(this.masterGain);
	src.start();
	this.soundscapeSource = src;
	this.soundscapeGain = gain;
	this.currentSoundscapeName = name;
},

_stopSoundscape() {
	if (this.soundscapeSource) {
		try { this.soundscapeSource.stop(); } catch {}
		this.soundscapeSource.disconnect();
		this.soundscapeSource = null;
	}
	if (this.soundscapeGain) {
		this.soundscapeGain.disconnect();
		this.soundscapeGain = null;
	}
},
```

And extend `stop()` to also stop the soundscape:

```js
stop() {
	if (!this.playing) return;
	if (this.noiseSource) { this.noiseSource.stop(); this.noiseSource.disconnect(); this.noiseSource = null; }
	if (this.bandFilters) { this.bandFilters.forEach(f => f.disconnect()); this.bandFilters = null; }
	this._stopSoundscape();
	this.currentSoundscapeName = null;
	this.playing = false;
},
```

The `try { .stop() } catch {}` is needed because calling `.stop()` on a node that hasn't started yet (or has already been stopped) throws. This is a Web Audio quirk, not speculative handling.

- [ ] **Step 3: Wire the soundscape picker and the Begin flow**

In the DOMContentLoaded handler:

```js
const soundscapeSelect = document.getElementById('soundscape');
const soundscapeLoading = document.getElementById('soundscape-loading');

async function loadSoundscapeWithIndicator(name) {
	if (name !== 'none' && !AudioEngine.soundscapeCache[name]) {
		soundscapeLoading.hidden = false;
	}
	try {
		await AudioEngine.loadSoundscape(name);
	} finally {
		soundscapeLoading.hidden = true;
	}
}

soundscapeSelect.addEventListener('change', () => {
	if (AudioEngine.playing) {
		loadSoundscapeWithIndicator(soundscapeSelect.value);
	}
});
```

And extend `toggleSession` so that when starting, it also loads the currently-selected soundscape:

```js
function toggleSession() {
	if (AudioEngine.playing) {
		AudioEngine.stop();
		beginBtn.textContent = 'Begin session';
		beginBtn.setAttribute('aria-pressed', 'false');
	} else {
		AudioEngine.start();
		AudioEngine.setMasterVolume(Number(volume.value) / 100);
		for (let i = 0; i < BAND_FREQS.length; i++) {
			AudioEngine.setBand(i, Number(document.getElementById(`band-${i}`).value));
		}
		loadSoundscapeWithIndicator(soundscapeSelect.value); // fire and forget, indicator handles UX
		beginBtn.textContent = 'Stop session';
		beginBtn.setAttribute('aria-pressed', 'true');
	}
}
```

- [ ] **Step 4: Verify**

Reload. Click Begin. Expected:
- With "Focus" preset selected, the "Loading…" label appears next to the soundscape select, then hides once the fetch+decode completes, and Rain begins playing alongside the noise bed
- Change soundscape to Ocean: "Loading…" appears briefly, then Ocean plays and the previous sample stops
- Change back to Rain: no "Loading…" label this time (cached), playback swaps instantly
- Change to None: only the sculpted noise remains, no label shown
- Click Stop, then Begin again: soundscape resumes without re-fetching (cache persists while the engine object lives)
- No console errors
- Check the network tab: `rain.ogg` is fetched exactly once; subsequent picks of the same name come from cache

- [ ] **Step 5: Commit**

```bash
git add projects/focus/index.html projects/focus/assets/
git commit -m "Add soundscape loader, cache, and picker wiring with six nature loops"
```

---

## Task 10: Entrainment oscillators (binaural, monaural, isochronic)

Add the three entrainment techniques. Each preset now plays its entrainment voice alongside the noise and soundscape. The Technique radio group switches live between modes without tearing down the rest of the graph.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Extend AudioEngine with entrainment methods**

Add to `AudioEngine`:

```js
CARRIER_HZ: 200,
entrainmentMode: 'none',
targetHz: 14,
oscL: null,
oscR: null,
pannerL: null,
pannerR: null,
entrainmentGain: null,
lfo: null,
lfoDepth: null,

_buildEntrainment() {
	this._teardownEntrainment();
	if (this.entrainmentMode === 'none') return;

	const gain = this.ctx.createGain();
	gain.gain.value = 0.15;

	if (this.entrainmentMode === 'binaural') {
		this.oscL = this.ctx.createOscillator();
		this.oscR = this.ctx.createOscillator();
		this.oscL.frequency.value = this.CARRIER_HZ;
		this.oscR.frequency.value = this.CARRIER_HZ + this.targetHz;
		this.pannerL = this.ctx.createStereoPanner();
		this.pannerR = this.ctx.createStereoPanner();
		this.pannerL.pan.value = -1;
		this.pannerR.pan.value = 1;
		this.oscL.connect(this.pannerL).connect(gain);
		this.oscR.connect(this.pannerR).connect(gain);
		this.oscL.start();
		this.oscR.start();
	} else if (this.entrainmentMode === 'monaural') {
		// No StereoPanner nodes: both oscillators route directly to `gain`,
		// which sums them acoustically. The beat exists in the audible signal,
		// so monaural works on speakers (unlike binaural, which requires
		// per-ear isolation to produce the beat in the brain).
		this.oscL = this.ctx.createOscillator();
		this.oscR = this.ctx.createOscillator();
		this.oscL.frequency.value = this.CARRIER_HZ;
		this.oscR.frequency.value = this.CARRIER_HZ + this.targetHz;
		this.oscL.connect(gain);
		this.oscR.connect(gain);
		this.oscL.start();
		this.oscR.start();
	} else if (this.entrainmentMode === 'isochronic') {
		this.oscL = this.ctx.createOscillator();
		this.oscL.frequency.value = this.CARRIER_HZ;
		this.oscL.connect(gain);
		this.oscL.start();
		// square-wave LFO modulating the gain at targetHz
		this.lfo = this.ctx.createOscillator();
		this.lfo.type = 'square';
		this.lfo.frequency.value = this.targetHz;
		this.lfoDepth = this.ctx.createGain();
		this.lfoDepth.gain.value = 0.5;
		this.lfo.connect(this.lfoDepth).connect(gain.gain); // modulate gain parameter
		gain.gain.value = 0.5; // center of the modulation
		this.lfo.start();
	}

	gain.connect(this.masterGain);
	this.entrainmentGain = gain;
},

_teardownEntrainment() {
	[this.oscL, this.oscR, this.lfo].forEach(o => {
		if (o) { try { o.stop(); } catch {} o.disconnect(); }
	});
	[this.pannerL, this.pannerR, this.lfoDepth, this.entrainmentGain].forEach(n => {
		if (n) n.disconnect();
	});
	this.oscL = this.oscR = this.lfo = null;
	this.pannerL = this.pannerR = this.lfoDepth = this.entrainmentGain = null;
},

setEntrainmentMode(mode) {
	this.entrainmentMode = mode;
	if (this.playing) this._buildEntrainment();
},

setTargetHz(hz) {
	this.targetHz = hz;
	if (!this.playing) return;
	if (this.entrainmentMode === 'binaural' || this.entrainmentMode === 'monaural') {
		if (this.oscR) this.oscR.frequency.setValueAtTime(this.CARRIER_HZ + hz, this.ctx.currentTime);
	} else if (this.entrainmentMode === 'isochronic') {
		if (this.lfo) this.lfo.frequency.setValueAtTime(hz, this.ctx.currentTime);
	}
},
```

Extend `start()` to call `_buildEntrainment()`:

```js
start() {
	if (this.playing) return;
	if (!this.ctx) {
		this.ctx = new (window.AudioContext || window.webkitAudioContext)();
		this.masterGain = this.ctx.createGain();
		this.masterGain.gain.value = 0.7;
		this.masterGain.connect(this.ctx.destination);
	}
	if (this.ctx.state === 'suspended') this.ctx.resume();
	this._buildNoise();
	this._buildEntrainment();
	this.playing = true;
},
```

Extend `stop()` to tear down entrainment:

```js
stop() {
	if (!this.playing) return;
	if (this.noiseSource) { this.noiseSource.stop(); this.noiseSource.disconnect(); this.noiseSource = null; }
	if (this.bandFilters) { this.bandFilters.forEach(f => f.disconnect()); this.bandFilters = null; }
	this._teardownEntrainment();
	this._stopSoundscape();
	this.currentSoundscapeName = null;
	this.playing = false;
},
```

- [ ] **Step 2: Wire the technique radio group and target-Hz slider**

In the DOMContentLoaded handler:

```js
document.querySelectorAll('input[name="technique"]').forEach(r => {
	r.addEventListener('change', () => {
		if (r.checked) AudioEngine.setEntrainmentMode(r.value);
	});
});

const targetHz = document.getElementById('target-hz');
const targetHzReadout = document.getElementById('target-hz-readout');
targetHz.addEventListener('input', () => {
	const hz = Number(targetHz.value);
	targetHzReadout.textContent = `${hz.toFixed(1)} Hz`;
	targetHz.setAttribute('aria-valuetext', `Target frequency ${hz.toFixed(1)} hertz`);
	document.getElementById('np-hz').textContent = hz.toFixed(1);
	AudioEngine.setTargetHz(hz);
});
```

And extend `toggleSession` so that when starting, it sets the engine mode and target Hz from the current UI values:

```js
function toggleSession() {
	if (AudioEngine.playing) {
		AudioEngine.stop();
		beginBtn.textContent = 'Begin session';
		beginBtn.setAttribute('aria-pressed', 'false');
	} else {
		AudioEngine.targetHz = Number(targetHz.value);
		AudioEngine.entrainmentMode = document.querySelector('input[name="technique"]:checked').value;
		AudioEngine.start();
		AudioEngine.setMasterVolume(Number(volume.value) / 100);
		for (let i = 0; i < BAND_FREQS.length; i++) {
			AudioEngine.setBand(i, Number(document.getElementById(`band-${i}`).value));
		}
		AudioEngine.loadSoundscape(soundscapeSelect.value);
		beginBtn.textContent = 'Stop session';
		beginBtn.setAttribute('aria-pressed', 'true');
	}
}
```

- [ ] **Step 3: Verify**

Reload. Plug in headphones. Expected:
- Focus preset is selected, technique is Isochronic. Click Begin. You hear sculpted rain, the noise bed, and a pulsing 200 Hz tone pulsing 14 times per second (isochronic).
- Switch technique to Binaural. The isochronic pulsing stops; instead you hear a steady 200 Hz tone in the left ear and a 214 Hz tone in the right ear. A 14 Hz beat is perceived by the brain.
- Switch to Monaural. Both tones sum acoustically — you hear a tremolo-like 14 Hz beat even if you unplug the headphones.
- Switch to Soundscape only. The entrainment voice stops entirely; noise and rain continue.
- Drag the target frequency slider to 6 Hz while Binaural is playing: the right-ear pitch drops to 206 Hz, the beat rate drops audibly.
- Switch preset to Sleep: technique jumps to Monaural, target Hz to 2.5, and you hear a slow 2.5 Hz tremolo.
- No clicks, pops, or console errors during technique switches.

- [ ] **Step 4: Inspect the graph**

In devtools console, during playback:
- `AudioEngine.entrainmentMode` matches the selected radio
- `AudioEngine.oscL` is an `OscillatorNode` in binaural and monaural and isochronic; `null` in soundscape-only
- `AudioEngine.lfo` is an `OscillatorNode` only in isochronic
- `AudioEngine.lfo.type === 'square'` in isochronic
- `AudioEngine.pannerL.pan.value === -1` in binaural; `AudioEngine.pannerL` is `null` in monaural

- [ ] **Step 5: Commit**

```bash
git add projects/focus/index.html
git commit -m "Add binaural, monaural, and isochronic entrainment with live technique and frequency switching"
```

---

## Task 11: Timer with fade-out, chime, and live-region announcement

Add the session timer. When the selected timer expires, the master gain fades to zero over 4 seconds, a short synthesized chime plays, and the live region announces "Session complete."

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Add a timer state holder and helpers**

In the DOMContentLoaded handler:

```js
const timerSelect = document.getElementById('timer');
const liveRegion = document.getElementById('live-region');
let sessionTimeoutId = null;

function playChime() {
	const ctx = AudioEngine.ctx;
	if (!ctx) return;
	// Chime bypasses masterGain on purpose: by the time the chime plays,
	// masterGain has been ramped to 0 by the fade-out and would mute it.
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.frequency.value = 880;
	osc.type = 'sine';
	gain.gain.setValueAtTime(0.3, ctx.currentTime);
	gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
	osc.connect(gain).connect(ctx.destination);
	osc.start();
	osc.stop(ctx.currentTime + 1.5);
}

function endSession(naturalEnd) {
	if (!AudioEngine.playing) return;
	const ctx = AudioEngine.ctx;
	const now = ctx.currentTime;
	AudioEngine.masterGain.gain.setValueAtTime(AudioEngine.masterGain.gain.value, now);
	AudioEngine.masterGain.gain.linearRampToValueAtTime(0, now + 4);
	setTimeout(() => {
		AudioEngine.stop();
		beginBtn.textContent = 'Begin session';
		beginBtn.setAttribute('aria-pressed', 'false');
		if (naturalEnd) {
			playChime();
			liveRegion.textContent = 'Session complete.';
		} else {
			liveRegion.textContent = 'Stopped.';
		}
	}, 4000);
}
```

- [ ] **Step 2: Rewire toggleSession to use endSession for manual stop, and to schedule the timer on start**

```js
function toggleSession() {
	if (AudioEngine.playing) {
		if (sessionTimeoutId) { clearTimeout(sessionTimeoutId); sessionTimeoutId = null; }
		endSession(false);
		return;
	}
	AudioEngine.targetHz = Number(targetHz.value);
	AudioEngine.entrainmentMode = document.querySelector('input[name="technique"]:checked').value;
	AudioEngine.start();
	AudioEngine.setMasterVolume(Number(volume.value) / 100);
	for (let i = 0; i < BAND_FREQS.length; i++) {
		AudioEngine.setBand(i, Number(document.getElementById(`band-${i}`).value));
	}
	AudioEngine.loadSoundscape(soundscapeSelect.value);
	beginBtn.textContent = 'Stop session';
	beginBtn.setAttribute('aria-pressed', 'true');

	const seconds = Number(timerSelect.value);
	if (seconds > 0) {
		// fade starts at (seconds - 4), so schedule endSession at (seconds - 4) to begin the fade
		sessionTimeoutId = setTimeout(() => {
			sessionTimeoutId = null;
			endSession(true);
		}, Math.max(0, (seconds - 4)) * 1000);
	}
}
```

- [ ] **Step 3: Verify**

Reload. Set Timer to 10 minutes — but for testing, temporarily set one `<option value="10">10 seconds</option>` or edit the timer value in devtools. Easier: open devtools and run `document.getElementById('timer').innerHTML += '<option value="10">Test 10s</option>'`. Select it. Click Begin. Expected:
- Audio plays for 6 seconds
- Master gain fades to zero over the final 4 seconds
- A brief bell tone plays (chime)
- Button returns to "Begin session"
- Devtools Accessibility panel shows the live region now reads "Session complete."
- `sessionTimeoutId` is null

Then click Begin with Timer Off. Click Stop manually after a few seconds. Expected:
- 4-second fade, no chime, live region reads "Stopped."

- [ ] **Step 4: Commit**

```bash
git add projects/focus/index.html
git commit -m "Add session timer with 4-second fade-out, synthesized chime, and live-region announcements"
```

---

## Task 12: Frequency ramp

Add the ramp feature. When the ramp slider is > 0, starting a session schedules a linear ramp of the entrainment frequency from `max(0.5, target - 2)` Hz to the target Hz over the ramp duration, and the UI target-Hz readout updates in sync.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Add ramp helper to AudioEngine**

Add to `AudioEngine`:

```js
rampTargetHz(fromHz, toHz, durationSec) {
	this.targetHz = toHz;
	if (!this.playing) return;
	const now = this.ctx.currentTime;
	if (this.entrainmentMode === 'binaural' || this.entrainmentMode === 'monaural') {
		if (this.oscR) {
			this.oscR.frequency.cancelScheduledValues(now);
			this.oscR.frequency.setValueAtTime(this.CARRIER_HZ + fromHz, now);
			this.oscR.frequency.linearRampToValueAtTime(this.CARRIER_HZ + toHz, now + durationSec);
		}
	} else if (this.entrainmentMode === 'isochronic') {
		if (this.lfo) {
			this.lfo.frequency.cancelScheduledValues(now);
			this.lfo.frequency.setValueAtTime(fromHz, now);
			this.lfo.frequency.linearRampToValueAtTime(toHz, now + durationSec);
		}
	}
},
```

- [ ] **Step 2: Wire the ramp slider readout**

In DOMContentLoaded:

```js
const rampSlider = document.getElementById('ramp');
const rampReadout = document.getElementById('ramp-readout');
rampSlider.addEventListener('input', () => {
	const v = Number(rampSlider.value);
	rampReadout.textContent = v === 0 ? 'Off' : `${v} min`;
	rampSlider.setAttribute('aria-valuetext', v === 0 ? 'Off' : `Ramp over ${v} minutes`);
});
rampSlider.dispatchEvent(new Event('input'));
```

- [ ] **Step 3: Extend toggleSession to apply the ramp on start**

In `toggleSession`, right after the existing `AudioEngine.start()` block and after the existing `AudioEngine.targetHz = Number(targetHz.value)` assignment, add the ramp logic. The cleanest place is immediately before the Timer block:

```js
const rampMinutes = Number(rampSlider.value);
if (rampMinutes > 0) {
	const targetEnd = Number(targetHz.value);
	const rampStart = Math.max(0.5, targetEnd - 2);
	AudioEngine.rampTargetHz(rampStart, targetEnd, rampMinutes * 60);
	// UI update over the ramp duration
	const startMs = performance.now();
	const durMs = rampMinutes * 60 * 1000;
	const tick = () => {
		const elapsed = performance.now() - startMs;
		const t = Math.min(1, elapsed / durMs);
		const current = rampStart + (targetEnd - rampStart) * t;
		targetHz.value = String(current.toFixed(1));
		targetHz.dispatchEvent(new Event('input'));
		if (t < 1 && AudioEngine.playing) requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
}
```

- [ ] **Step 4: Verify**

For testing, set the ramp slider to 1 (1 minute — or temporarily edit the slider max in devtools to allow a shorter ramp). Select Focus preset (target 14 Hz). Click Begin. Expected:
- The target frequency slider starts at 12 Hz and visibly climbs to 14 Hz over the ramp window
- The Now Playing "Frequency" readout updates in real time
- Audibly, the beat rate speeds up
- When the ramp completes, the slider stops at the target
- Click Stop mid-ramp: the ramp stops, the slider stays at whatever value it reached

- [ ] **Step 5: Commit**

```bash
git add projects/focus/index.html
git commit -m "Add frequency ramp with linear Web Audio ramp and synchronized slider UI"
```

---

## Task 13: First-run headphone panel with binaural fallback

Add the headphone panel that appears on first visit and persists the answer. If the answer is "No", presets whose default technique is `binaural` are silently upgraded to `monaural` at `applyPreset` time, so the UI reflects the fallback.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Add CSS for the panel**

Append to `<style>`:

```css
#first-run-panel {
	background: #0f3460;
	padding: 0.75rem 1rem;
	border-radius: 4px;
	margin-bottom: 1rem;
}
#first-run-panel button { margin-right: 0.5rem; }
```

- [ ] **Step 2: Render the panel and wire responses**

In DOMContentLoaded, before the preset selection logic:

```js
const firstRunPanel = document.getElementById('first-run-panel');
if (state.hasHeadphones === undefined) {
	firstRunPanel.hidden = false;
	firstRunPanel.innerHTML = `
		<p id="headphone-q">Are you wearing stereo headphones? Binaural beats need them; other modes don't.</p>
		<div role="group" aria-labelledby="headphone-q">
			<button type="button" data-hp="yes">Yes</button>
			<button type="button" data-hp="no">No</button>
			<button type="button" data-hp="later">Ask me later</button>
		</div>
	`;
	firstRunPanel.querySelectorAll('button').forEach(b => {
		b.addEventListener('click', () => {
			const v = b.dataset.hp;
			if (v === 'yes') saveState({ hasHeadphones: true });
			else if (v === 'no') saveState({ hasHeadphones: false });
			// 'later' saves nothing
			firstRunPanel.hidden = true;
			// re-apply current preset so the technique reflects the new fallback
			selectPreset(document.querySelector('#preset-strip button[aria-checked="true"]').dataset.presetId);
		});
	});

	// Escape dismisses (equivalent to "later") — listen on document so it works
	// even before the user has tabbed into the panel
	const escapeHandler = (e) => {
		if (e.key === 'Escape' && !firstRunPanel.hidden) {
			firstRunPanel.hidden = true;
			document.removeEventListener('keydown', escapeHandler);
		}
	};
	document.addEventListener('keydown', escapeHandler);
}
```

- [ ] **Step 3: Extend applyPreset to fall back binaural → monaural**

Replace `applyPreset`:

```js
function applyPreset(preset) {
	const s = loadState();
	const effectiveTechnique = (preset.technique === 'binaural' && s.hasHeadphones === false)
		? 'monaural'
		: preset.technique;
	document.getElementById('np-preset').textContent = preset.name;
	document.getElementById('np-hz').textContent = preset.hz.toFixed(1);
	document.getElementById('target-hz').value = String(preset.hz);
	document.getElementById('target-hz-readout').textContent = `${preset.hz.toFixed(1)} Hz`;
	document.querySelector(`input[name="technique"][value="${effectiveTechnique}"]`).checked = true;
	document.getElementById('soundscape').value = preset.soundscape;
	const curve = EQ_CURVES[preset.eq];
	curve.forEach((v, i) => {
		const input = document.getElementById(`band-${i}`);
		input.value = String(v);
		input.dispatchEvent(new Event('input'));
	});
}
```

- [ ] **Step 4: Verify**

Clear `localStorage`: `localStorage.removeItem('focus.state')`, then reload. Expected:
- The headphone panel appears at the top of Now Playing
- Click "No". The panel hides. Re-check technique radio — binaural presets (Creativity, Relaxation) now default to Monaural. Select Creativity: Monaural is checked, not Binaural.
- Reload. The panel does not reappear. Creativity still defaults to Monaural.
- Clear `localStorage` again, reload, click "Yes". Creativity now defaults to Binaural.
- Clear `localStorage`, reload, click "Ask me later". Reload again — the panel reappears.
- The panel dismisses when Escape is pressed while focused inside it.

- [ ] **Step 5: Commit**

```bash
git add projects/focus/index.html
git commit -m "Add first-run headphone panel with binaural-to-monaural fallback"
```

---

## Task 14: About modal with honest evidence summary and references

Populate the About dialog with the content from the spec. Opens from the header button, closes with Escape or the Close button.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Fill in the About dialog content**

Replace the About dialog body in the markup:

```html
<dialog id="about-dialog" aria-labelledby="about-heading">
	<h2 id="about-heading">About Focus</h2>
	<p>Focus uses brainwave entrainment techniques — binaural beats, monaural beats, and isochronic tones — alongside a sculpted noise bed and optional nature soundscapes. Each preset sets a target frequency associated with a brainwave band, and the entrainment voice drives that frequency.</p>

	<p>The evidence is mixed. There is moderate support for effects on anxiety and attention. Effects on "creativity" and "flow" are largely anecdotal, and individual responses vary widely across studies. Treat this as an experiment on yourself: notice what seems to help, ignore what doesn't.</p>

	<p>Focus makes no health claims and is not a treatment for any medical condition.</p>

	<h3>Brainwave band key</h3>
	<ul>
		<li><strong>Delta (0.5–4 Hz):</strong> deep sleep, restoration</li>
		<li><strong>Theta (4–8 Hz):</strong> meditation, hypnagogic states, some associations with insight</li>
		<li><strong>Alpha (8–13 Hz):</strong> relaxed alertness, eyes closed, calm</li>
		<li><strong>Beta (13–30 Hz):</strong> active thinking, focused attention</li>
		<li><strong>Gamma (30+ Hz):</strong> peak cognition, cross-region binding</li>
	</ul>

	<h3>References</h3>
	<ul>
		<li><a href="https://doi.org/10.3389/fnhum.2019.00167" target="_blank" rel="noopener">Garcia-Argibay, Santed, and Reales (2019). Efficacy of binaural auditory beats in cognition, anxiety, and pain perception: a meta-analysis. <em>Frontiers in Human Neuroscience</em>.</a></li>
		<li><a href="https://doi.org/10.3389/fnhum.2017.00557" target="_blank" rel="noopener">Chaieb et al. (2017). Auditory beat stimulation and its effects on cognition and mood states. <em>Frontiers in Human Neuroscience</em>.</a></li>
		<li><a href="https://doi.org/10.1080/08990220.2015.1091768" target="_blank" rel="noopener">Jirakittayakorn & Wongsawat (2017). Brain responses to a 6-Hz binaural beat: effects on general theta rhythm and frontal EEG. <em>Frontiers in Neuroscience</em>.</a></li>
		<li><a href="https://doi.org/10.1016/j.actpsy.2014.02.004" target="_blank" rel="noopener">López-Caballero & Escera (2017). Binaural beat: a failure to enhance EEG power and emotional arousal. <em>Frontiers in Human Neuroscience</em>.</a> (null result — fair to show)</li>
	</ul>

	<p>For soundscape attribution, see the <button type="button" id="about-to-credits">Credits</button> dialog.</p>

	<form method="dialog"><button type="submit">Close</button></form>
</dialog>
```

**Important:** verify each DOI and link actually resolves before committing. If any link is broken, replace it with another peer-reviewed review or meta-analysis. The point is that the references must be real.

- [ ] **Step 2: Wire the open/close**

In DOMContentLoaded:

```js
const aboutDialog = document.getElementById('about-dialog');
document.getElementById('about-btn').addEventListener('click', () => aboutDialog.showModal());
document.getElementById('about-to-credits').addEventListener('click', () => {
	aboutDialog.close();
	document.getElementById('credits-dialog').showModal();
});
```

- [ ] **Step 3: Verify**

Reload. Click About in the header. Expected:
- Modal opens, focus moves inside
- Screen reader (or devtools accessibility inspector) announces it as a dialog with the "About Focus" heading
- Tab cycles only within the dialog
- Escape closes it; focus returns to the About button
- Each reference link opens in a new tab when clicked
- Click the in-modal "Credits" button → About closes, Credits opens (Credits itself is still the placeholder from Task 2, to be filled in Task 15)

- [ ] **Step 4: Commit**

```bash
git add projects/focus/index.html
git commit -m "Populate About dialog with evidence summary, band key, and peer-reviewed references"
```

---

## Task 15: Credits modal with sample attribution

Populate the Credits dialog with the attribution for each soundscape file sourced in Task 9. The exact contents depend on which files were selected.

**Files:**
- Modify: `projects/focus/index.html`

- [ ] **Step 1: Replace the Credits dialog body**

```html
<dialog id="credits-dialog" aria-labelledby="credits-heading">
	<h2 id="credits-heading">Credits</h2>
	<p>All soundscape samples are used under Creative Commons Zero (public domain) unless otherwise noted.</p>
	<ul>
		<li>Rain — "[sample title]" by [author handle], <a href="[freesound url]" target="_blank" rel="noopener">freesound.org/[sample id]</a> (CC0)</li>
		<li>Ocean — "[sample title]" by [author handle], <a href="[freesound url]" target="_blank" rel="noopener">freesound.org/[sample id]</a> (CC0)</li>
		<li>Forest wind — "[sample title]" by [author handle], <a href="[freesound url]" target="_blank" rel="noopener">freesound.org/[sample id]</a> (CC0)</li>
		<li>Fire — "[sample title]" by [author handle], <a href="[freesound url]" target="_blank" rel="noopener">freesound.org/[sample id]</a> (CC0)</li>
		<li>Thunder — "[sample title]" by [author handle], <a href="[freesound url]" target="_blank" rel="noopener">freesound.org/[sample id]</a> (CC0)</li>
		<li>Cafe — "[sample title]" by [author handle], <a href="[freesound url]" target="_blank" rel="noopener">freesound.org/[sample id]</a> (CC0)</li>
	</ul>
	<p>Pink noise generated via Paul Kellet's filter approximation.</p>
	<form method="dialog"><button type="submit">Close</button></form>
</dialog>
```

Replace the `[...]` placeholders with the actual sample titles, author handles, and freesound.org URLs recorded in Task 9. If any sample is CC-BY instead of CC0, label it `(CC-BY 4.0)` and the license is satisfied by the in-app attribution.

- [ ] **Step 2: Wire the Credits button**

In DOMContentLoaded:

```js
const creditsDialog = document.getElementById('credits-dialog');
document.getElementById('credits-btn').addEventListener('click', () => creditsDialog.showModal());
```

- [ ] **Step 3: Verify**

Click Credits. Expected:
- Modal opens with all six samples listed
- Every link points to a real, resolvable freesound.org URL (click each to confirm)
- Every author handle matches what appears on freesound for that sample
- Escape closes; focus returns to the Credits button

- [ ] **Step 4: Commit**

```bash
git add projects/focus/index.html
git commit -m "Populate Credits dialog with soundscape attribution"
```

---

## Task 16: Global keyboard shortcuts, final verification, and cleanup

Add the Space/M global toggle for Begin/Stop, then run the full spec success-criteria verification, fix anything that fails, and delete the sanity-check harness.

**Files:**
- Modify: `projects/focus/index.html`
- Delete: `projects/focus/sanity-check.html`

- [ ] **Step 1: Add global keyboard shortcut**

In DOMContentLoaded:

```js
document.addEventListener('keydown', (e) => {
	const el = document.activeElement;
	const tag = el?.tagName;
	const inputType = el?.type;
	// A text-editable input is a <textarea> or an <input> whose type is not range/radio
	const isEditable = tag === 'TEXTAREA' || (tag === 'INPUT' && inputType !== 'range' && inputType !== 'radio');
	if (isEditable) return;
	if (e.key === ' ' || e.key.toLowerCase() === 'm') {
		// Don't steal Space from buttons, range, or radio — let native activation/scrubbing work
		if (e.key === ' ' && (tag === 'BUTTON' || inputType === 'range' || inputType === 'radio')) return;
		e.preventDefault();
		toggleSession();
	}
});
```

- [ ] **Step 2: Run the full spec success-criteria checklist**

Open `docs/superpowers/specs/2026-04-10-focus-design.md` and walk through every one of the 13 success criteria. For each, perform the verification and record PASS or FAIL. Any FAIL must be fixed before the task completes. The criteria:

1. **Loads as a static file.** Open from `file://` and from a static server. Both load with no errors. No network requests after assets finish loading.
2. **All six presets play audibly on Begin.** Click each, Begin, hear audio, no errors.
3. **Each entrainment technique produces the expected signal.** For each technique: inspect `AudioEngine` properties in devtools, confirm nodes match the design. Confirm isochronic `lfo.type === 'square'` and its frequency equals the target Hz.
4. **Target-Hz slider re-tunes playback live.** Drag during playback. The beat changes without restart.
5. **10-band EQ sliders sculpt the noise live.** Drag each band. Audible change. Macro sliders move multiple band sliders and update aria-valuetext.
6. **Timer runs down with fade and chime.** Set a short test timer. Fade, chime, "Session complete." announced.
7. **Frequency ramp walks the target.** Enable ramp. Start. Slider UI and audible beat shift.
8. **Headphone panel persists the answer.** Clear `localStorage`, reload, answer No, reload, confirm panel gone and binaural presets default to monaural.
9. **Fully operable by keyboard alone.** Tab through every control. Space on Begin. Arrow keys on sliders and preset radios. Escape in modals.
10. **Screen reader reads every control meaningfully.** Run through with NVDA. Every preset, every slider, every select, every button, both modals.
11. **No console errors or warnings during a full playthrough.** 30 seconds of audio per preset. Clean console.
12. **First-run flow is clean.** Clear, reload, headphone panel appears, answer, persists.
13. **Credits modal lists real, verifiable attribution.** Every link resolves, every author matches.

- [ ] **Step 3: Fix any failures**

Any criterion that fails → fix the code, re-run that criterion, repeat until all 13 pass. Each fix is its own tiny diff; don't batch unrelated fixes. Each gets its own commit so the review trail stays clean.

- [ ] **Step 4: Delete the sanity-check harness**

```bash
rm projects/focus/sanity-check.html
```

- [ ] **Step 5: Final commit**

```bash
git add projects/focus/index.html
git rm projects/focus/sanity-check.html
git commit -m "Add global Space/M session toggle, pass all spec success criteria, and remove dev sanity harness"
```

- [ ] **Step 6: Summary**

Confirm via `git log --oneline` that the branch shows a clean sequence of commits, each named after its task, with no squash-worthy noise.

---

## Execution notes

- Commit after every task. Do not skip.
- If any task drifts beyond ~30 minutes of work, stop and surface it — that's a signal the task is wrong or the spec was wrong.
- The spec is authoritative. If this plan contradicts the spec, the spec wins — stop and raise it.
- If any assumption in the "Spec interpretations locked in" section turns out to be wrong at implementation time, stop and surface it rather than guessing.
