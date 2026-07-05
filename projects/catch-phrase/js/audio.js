export const MIN_ROUND_MS = 45000;
export const MAX_ROUND_MS = 75000;

const SLOW_BEEP_MS = 900;
const MEDIUM_BEEP_MS = 600;
const FAST_BEEP_MS = 350;
const BEEP_GAIN = 0.12;

export function planRound(rng = Math.random) {
	const totalMs = MIN_ROUND_MS + rng() * (MAX_ROUND_MS - MIN_ROUND_MS);
	const phaseMs = totalMs / 3;
	return {
		totalMs,
		phases: [
			{ untilMs: phaseMs, intervalMs: SLOW_BEEP_MS },
			{ untilMs: phaseMs * 2, intervalMs: MEDIUM_BEEP_MS },
			{ untilMs: totalMs, intervalMs: FAST_BEEP_MS },
		],
	};
}

export function createAudio() {
	let ctx = null;

	function ensureContext() {
		if (!ctx) {
			const AC = window.AudioContext || window.webkitAudioContext;
			if (!AC) return null;
			ctx = new AC();
		}
		if (ctx.state === 'suspended') ctx.resume();
		return ctx;
	}

	function tone(freq, delayMs, durationMs, gainValue, type) {
		const context = ensureContext();
		if (!context) return;
		const osc = context.createOscillator();
		const gain = context.createGain();
		const start = context.currentTime + delayMs / 1000;
		osc.type = type;
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(gainValue, start);
		gain.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000);
		osc.connect(gain).connect(context.destination);
		osc.start(start);
		osc.stop(start + durationMs / 1000);
	}

	return {
		unlock: ensureContext,
		beep() {
			tone(880, 0, 80, BEEP_GAIN, 'square');
		},
		buzzer() {
			tone(150, 0, 900, BEEP_GAIN * 2, 'sawtooth');
		},
		fanfare() {
			[523, 659, 784, 1047].forEach((freq, i) => tone(freq, i * 150, 200, BEEP_GAIN, 'square'));
		},
	};
}

export function createRoundTimer(audio, rng = Math.random) {
	let timeoutId = null;
	return {
		start(onExpire) {
			const plan = planRound(rng);
			const startedAt = Date.now();
			const tick = () => {
				const elapsed = Date.now() - startedAt;
				if (elapsed >= plan.totalMs) {
					audio.buzzer();
					onExpire();
					return;
				}
				audio.beep();
				const phase = plan.phases.find((p) => elapsed < p.untilMs);
				timeoutId = setTimeout(tick, phase.intervalMs);
			};
			tick();
		},
		stop() {
			clearTimeout(timeoutId);
		},
	};
}
