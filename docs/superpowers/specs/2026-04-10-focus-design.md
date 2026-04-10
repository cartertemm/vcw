# Focus — Design Spec

**Date:** 2026-04-10
**Project directory:** `projects/focus/`
**Status:** approved for implementation planning

## Summary

Single-page, zero-build JavaScript app for brainwave entrainment and soundscape sculpting. A mynoise.net-inspired experience combined with binaural, monaural, and isochronic entrainment techniques, organized around six goal-oriented presets (Creativity, Flow, Focus, Productivity, Relaxation, Sleep). Fully self-contained as `index.html` plus a small `assets/` folder of Creative-Commons-zero audio loops. Treated as an experiment in fringe science — honest about evidence, out-of-the-way about explaining it.

All controls are operable by keyboard and fully accessible to screen readers.

## Working rules for spec, plan, and implementation

These rules apply to every section that follows and to the implementation itself.

**Minimum code.** Nothing speculative. No features beyond what is specified here. No abstractions for single-use code. No flexibility or configurability that wasn't requested. No error handling for impossible scenarios. If 200 lines could be 50, rewrite it. Apply the senior-engineer test: if it would be called overcomplicated, simplify.

**Verifiable success criteria.** Every implementation task must have a concrete, checkable success criterion. Multi-step work states a brief step → verify plan. Vague tasks ("make it work") get rewritten into verifiable form before starting. No task is marked complete until its verification actually passes.

## Scope decisions

| Decision | Choice |
|---|---|
| File shape | Single `index.html` + `assets/` folder, no build step, no external runtime dependencies |
| Audio library | Raw Web Audio API only |
| Interaction model | Hybrid: goal-first preset strip that expands into a full sculpting view with the preset's values pre-loaded |
| Entrainment techniques | Binaural, monaural, isochronic, and soundscape-only (no entrainment) |
| Presets | Six, exposed as one row of radio buttons |
| Session model | Free-run with optional timer (fade + chime) and optional frequency ramp |
| Soundscape catalog | Four synthesized noise sources + six CC0 nature loops |
| Accessibility approach | Single unified view, native semantic controls, AT-first design |
| Animation | None in v1 |

## File layout

```
projects/focus/
├── index.html           # all markup, CSS, and JS
├── README.md            # brief description and credits pointer
└── assets/
    ├── rain.ogg
    ├── ocean.ogg
    ├── forest-wind.ogg
    ├── fire.ogg
    ├── thunder.ogg
    └── cafe.ogg
```

Six seamless-loop samples, ~30–60 s each, ~3–6 MB total, lazy-loaded on first use. All samples sourced from freesound.org under CC0.

## Internal JS structure

Deliberately trimmed from a five-module sketch to the minimum that still separates concerns. Inside one `<script>` block in `index.html`:

- **`AudioEngine`** — the only piece that knows about the Web Audio node graph. Narrow API: `start()`, `stop()`, `setTargetHz(hz)`, `setEntrainmentMode(mode)`, `setBand(i, gainDb)`, `setMasterVolume(v)`, `loadSoundscape(name)`, `rampTargetHz(toHz, durationSec)`. Does not touch the DOM.
- **`PRESETS`** — a plain array of six preset data objects. No class, no module, no factory.
- **UI layer** — the rest of the script. Wires DOM events, owns the session timer, opens modals, calls into `AudioEngine`. The only code that touches `document`.
- **`loadState()` / `saveState()`** — two helpers over `localStorage`. Not a module.

## Audio engine

### Node graph

Built on first Begin (browsers require a user gesture to create an `AudioContext`). Torn down on Stop.

```
                                       ┌─> [EntrainmentGain] ─┐
[Oscillator L] ─[StereoPanner -1] ────┤                       │
[Oscillator R] ─[StereoPanner +1] ────┤                       │
                                       │                       ├─> [MasterGain] ─> destination
[NoiseSource] ─> [10× BiquadFilter] ──┤                       │
                                       │                       │
[SoundscapeBuffer] ─> [SoundscapeGain]┘                       │
```

Three sound sources routed through one master gain: the entrainment voice, the sculpted noise bed, and the optional soundscape loop.

### Entrainment modes

Switching modes tears down and rebuilds only the oscillator section. The noise chain and the soundscape keep playing uninterrupted.

- **Binaural.** Two sine oscillators. Left at `carrier` Hz, panned full left. Right at `carrier + targetHz`, panned full right. `EntrainmentGain` held constant. Carrier defaults to 200 Hz.
- **Monaural.** Same two oscillators, both panned center, summed acoustically in the graph. The beat at `targetHz` exists in the audible signal itself and works on speakers.
- **Isochronic.** One sine oscillator at `carrier`, center-panned. A single LFO drives `EntrainmentGain` as a square wave at `targetHz`, pulsing the carrier on and off at the target rate.
- **Soundscape-only.** Oscillators are not created. `EntrainmentGain` is not inserted.

### Noise generation

One `AudioBufferSourceNode` plays a pre-filled 2-second buffer, looping. The buffer is filled once at startup:

- **White** — uniform random samples.
- **Pink** — Voss-McCartney algorithm.
- **Brown** — integrated white noise, normalized.
- **Grey** — white shaped by an inverse-equal-loudness curve (coefficients pre-computed, single pass).

Ten `BiquadFilter` nodes of type `"peaking"` in series after the noise source, at logarithmically-spaced centers: 32, 64, 125, 250, 500, 1k, 2k, 4k, 8k, 16k Hz. Each slider adjusts the `gain` parameter of one filter in the range –24 to +12 dB. Q is fixed at 1.0.

### Soundscape loops

`fetch()` the `.ogg` on demand, decode into an `AudioBuffer`, play through an `AudioBufferSourceNode` with `loop = true`. None are fetched until the user picks one. A small "Loading…" label appears beside the soundscape picker while decoding.

### Frequency ramp

One `linearRampToValueAtTime` call on the relevant oscillator `frequency` parameter (or the LFO `frequency` for isochronic). Ramp target and duration come from the preset or the ramp slider. No envelope objects, no scheduling abstractions.

## Preset data

```js
const PRESETS = [
    { id: 'creativity',   name: 'Creativity',   band: 'Theta',      hz: 6.0,  technique: 'binaural',   soundscape: 'forest-wind', eq: 'warm'    },
    { id: 'flow',         name: 'Flow',         band: 'High Alpha', hz: 10.5, technique: 'monaural',   soundscape: 'ocean',       eq: 'neutral' },
    { id: 'focus',        name: 'Focus',        band: 'Low Beta',   hz: 14.0, technique: 'isochronic', soundscape: 'rain',        eq: 'neutral' },
    { id: 'productivity', name: 'Productivity', band: 'Mid Beta',   hz: 18.0, technique: 'isochronic', soundscape: 'cafe',        eq: 'bright'  },
    { id: 'relaxation',   name: 'Relaxation',   band: 'Low Alpha',  hz:  9.0, technique: 'binaural',   soundscape: 'fire',        eq: 'warm'    },
    { id: 'sleep',        name: 'Sleep',        band: 'Delta',      hz:  2.5, technique: 'monaural',   soundscape: 'thunder',     eq: 'dark'    },
];
```

The four named EQ curves (`neutral`, `warm`, `bright`, `dark`) are ten-element arrays of initial slider gain values, hard-coded as seed data. They are not a runtime abstraction.

## User interface

### Layout

Single page, three vertical regions.

```
┌─────────────────────────────────────────┐
│ HEADER                                  │
│ Focus · [About] [Credits]               │
├─────────────────────────────────────────┤
│ PRESET STRIP (role="radiogroup")        │
│ [Creativity] [Flow] [Focus]             │
│ [Productivity] [Relaxation] [Sleep]     │
├─────────────────────────────────────────┤
│ NOW PLAYING                             │
│ Preset: Focus · Frequency: 14.0 Hz      │
│                                         │
│ [▶ Begin session]  volume ──●────       │
│                                         │
│ ▼ Customize (details/summary)           │
│ ├ Technique (radio group)               │
│ ├ Target frequency (slider)             │
│ ├ Soundscape (select)                   │
│ ├ Timer (select)                        │
│ ├ Frequency ramp (slider)               │
│ │                                       │
│ │ Macro sculpting                       │
│ │ Brightness (slider)  Warmth (slider)  │
│ │                                       │
│ │ Bands (fieldset with 10 sliders)      │
│ └                                       │
└─────────────────────────────────────────┘
```

### Controls

- **Preset strip.** `role="radiogroup"` of six `role="radio"` buttons. Arrow keys move selection. Picking a preset updates Now Playing and seeds Customize from the preset data, but does not auto-start audio.
- **Begin / Stop.** One button that toggles its label and `aria-pressed` state. Space or `m` toggles it globally from anywhere on the page.
- **Customize.** A native `<details>` element. Open/closed state is persisted.
- **Technique.** Four-option radio group: Binaural, Monaural, Isochronic, Soundscape only.
- **Target frequency.** `<input type="range">`, min 0.5 Hz, max 45 Hz, step 0.1 Hz. Live updates the engine during playback.
- **Soundscape.** `<select>` with seven options: None, Rain, Ocean, Forest wind, Fire, Thunder, Cafe.
- **Timer.** `<select>` with options: Off, 10 min, 20 min, 45 min, 90 min.
- **Frequency ramp.** `<input type="range">`, min 0 (off), max 15 (minutes). A label beside it says "Off" when at 0, otherwise "Ramp over N min." When on, the ramp target equals the current preset's `hz`; the starting frequency is `max(0.5, target - 2)` Hz, so Sleep (target 2.5 Hz) starts at the 0.5 Hz floor. (Minimal, non-configurable.)
- **Macro sliders.** Two `<input type="range">` controls, Brightness and Warmth, each driving a small fixed curve over the 10 band sliders. Moving a macro updates the band sliders visually and in value. Moving a band slider does not back-propagate to the macros.
- **10 band sliders.** Inside a `<fieldset>` with `<legend>Bands</legend>`. Each is an `<input type="range">` with a visible text label (descriptive name with Hz as secondary text), `min="-24"`, `max="12"`, `step="0.5"`, and an `aria-valuetext` that reads like `"Low bass: -3 decibels"`.
- **Master volume.** One `<input type="range">` in the Now Playing block, 0 to 100.

### First-run panel

On first visit, before any audio is created, a small inline panel at the top of the Now Playing block asks: *"Are you wearing stereo headphones? Binaural beats need them; other modes don't."* Three buttons: Yes, No, Ask me later. Answer is persisted. If No, presets whose default `technique` is `binaural` start in `monaural` mode instead. The panel is dismissible with Escape.

### Modals

Two `<dialog>` elements: About and Credits. Both are native HTML dialogs — focus-trapped, closed by Escape, opened from the header. Each is a few lines of JS.

- **About.** One paragraph of neutral background on brainwave entrainment, one paragraph on what the evidence does and doesn't support (honest about mixed results on creativity and flow; moderate support for effects on anxiety and attention), a short "treat this as an experiment" note, a bulleted key to the five bands, and a References section with 4–6 links to peer-reviewed reviews and meta-analyses. Real citations, sourced during implementation.
- **Credits.** Lists each soundscape sample, its freesound.org URL, the author handle, and the CC0 label.

## Persistence

`localStorage` under one key, `focus.state`, with shape:

```js
{
    lastPresetId: 'focus',
    masterVolume: 0.7,
    hasHeadphones: true,      // or false, or null (not asked)
    customEqByPresetId: {},   // sparse; preset id -> 10-element gain array
    customizeOpen: false
}
```

`loadState()` reads on page ready. `saveState()` is called directly at each mutation site — no watcher, no observer, no debounce. No migration, no versioning.

## Session lifecycle

1. **Page load.** `loadState()`. Render the preset strip with `lastPresetId` selected. Render Now Playing with that preset's values. Show the headphone panel if `hasHeadphones` is null. Do not create an `AudioContext`.
2. **User picks a different preset.** Update Now Playing, reseed Customize controls, update `lastPresetId`, save state. Do not start audio.
3. **User hits Begin.** Create `AudioContext` if it doesn't exist. Build the node graph from the current Customize values. If a soundscape is selected, fetch and decode the sample (show a brief "Loading…"). Start all source nodes. Button label and `aria-pressed` flip to Stop. Apply the frequency ramp if enabled. Start the timer if enabled.
4. **During playback.** Slider changes call into the engine live. Technique changes rebuild the oscillator section only. Preset picks during playback reseed Customize and apply the new values immediately.
5. **Timer expires.** Fade `MasterGain` to zero over 4 seconds using `linearRampToValueAtTime`. Play a short decaying sine chime (synthesized, no sample). Stop all source nodes. Announce "Session complete" via `aria-live="polite"`.
6. **User hits Stop manually.** Same fade, no chime. Announce "Stopped."
7. **Tab hidden or navigation.** No pause. Playback continues — users may want to background the tab. This is intentional.

## Accessibility

All non-negotiables apply to every visible control.

- Native semantic elements only: `<button>`, `<input type="range">`, `<select>`, `<fieldset>`/`<legend>`, `<details>`/`<summary>`, `<dialog>`, `role="radiogroup"`/`role="radio"`. No custom composite widgets.
- Every control is reachable and operable by keyboard, with a visible focus indicator.
- Tab order follows visual order: header → preset strip → Begin → volume → Customize disclosure → inside-Customize controls → modals.
- Every slider has `aria-valuetext` that reads a human phrase, not a raw number.
- Every button has a readable text label. No icon-only buttons.
- Space or `m` from anywhere toggles Begin/Stop; Escape closes the headphone panel or any open `<dialog>`.
- Modals are `<dialog>` elements with focus trap and Escape close (native behavior).
- No animated content in v1. `prefers-reduced-motion` is honored by default because nothing moves.
- The content does not rely on color alone; the selected preset is indicated by both color and a text/state marker.
- Color contrast meets WCAG AA on the dark theme.

## Science and honesty

The app is framed as an experiment. It makes no health claims. The About modal explicitly notes that evidence for brainwave entrainment varies widely across studies and individuals, that effects on creativity and flow are largely anecdotal, and that moderate evidence exists for effects on anxiety and attention. References are peer-reviewed and linked.

## Success criteria

Every item below is a verification step the build must pass before it is considered done.

1. **Loads as a static file.** Open `index.html` from `file://` and from a static server; both load without errors. No network requests after assets finish loading.
2. **All six presets play audibly on Begin.** Click each preset, hit Begin, hear audio within 1 second, no console errors.
3. **Each entrainment technique produces the expected signal.** For each of binaural, monaural, isochronic, and soundscape-only: inspect the node graph in devtools and confirm oscillators, LFO, and panners are wired per the design. For isochronic, confirm `EntrainmentGain` is modulated as a square wave at the target Hz.
4. **Target-Hz slider re-tunes playback live.** During playback, drag the frequency slider; the audible beat changes without a restart.
5. **10-band EQ sliders sculpt the noise live.** During playback, drag each band; the audible tone changes. Macro sliders move multiple band sliders together and update their `aria-valuetext`.
6. **Timer runs down with fade and chime.** Set a 10-second timer; the last 4 seconds fade out; a chime plays; the live region announces "Session complete."
7. **Frequency ramp walks the target.** Enable ramp on a preset and start; the frequency slider UI reflects the moving target Hz; the audible beat shifts over the ramp window.
8. **Headphone panel persists the answer.** Answer "No" and reload; the panel is gone; presets whose default technique is binaural now start in monaural.
9. **Fully operable by keyboard alone.** Without a mouse, Tab through every control in logical order, activate Begin with Space, adjust sliders with arrow keys, pick presets with arrow keys, open and close modals with Escape.
10. **Screen reader reads every control meaningfully.** Run through with NVDA on Windows. Preset radios, technique radios, all sliders, timer select, soundscape select, Begin/Stop, and both modals all announce with readable labels and current values (`aria-valuetext` on sliders).
11. **No console errors or warnings during a full playthrough.** Devtools console stays clean from load through a 30-second playback of each preset.
12. **First-run flow is clean.** Clear `localStorage`, reload, confirm the headphone panel appears; answer it; confirm it persists on reload.
13. **Credits modal lists real, verifiable attribution.** Every soundscape sample in `assets/` has an entry in the Credits modal pointing to its freesound.org URL and author.
