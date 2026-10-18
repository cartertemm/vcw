const SOUND_FILES = {
	reveal: "BELL.MAC [1].wav",
	ding: "DING.MAC [1].wav",
	strike: "BUZZER.MAC [1].wav",
	miss: "LO_BUZZ.MAC [1].wav",
	buzzIn: "FONEBUZZ.MAC [1].wav",
	intro: "DIDILIDI.MAC [1].wav",
	select: "SELECT.SND [1].wav",
	applauseStart: "CLAPS1.SND [1].wav",
	win: "WIN_RIFF.SND.wav",
};

const APPLAUSE_FILES = ["FEUDCLP1.wav", "FEUDCLP2.wav", "FEUDCLP3.wav", "FEUDCLP4.wav", "FEUDCLP5.wav"];

export function soundUrl(fileName) {
	return `sounds/${encodeURIComponent(fileName)}`;
}

export function createAudio() {
	const buffers = new Map();
	let ctx = null;

	function ensureContext() {
		if (!ctx) {
			const AC = window.AudioContext || window.webkitAudioContext;
			if (!AC) return null;
			ctx = new AC();
			loadAll();
		}
		if (ctx.state === "suspended") ctx.resume();
		return ctx;
	}

	function loadAll() {
		for (const fileName of [...Object.values(SOUND_FILES), ...APPLAUSE_FILES]) {
			fetch(soundUrl(fileName))
				.then(res => res.arrayBuffer())
				.then(data => new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)))
				.then(buffer => buffers.set(fileName, buffer))
				.catch(() => {});
		}
	}

	function play(fileName) {
		const context = ensureContext();
		const buffer = buffers.get(fileName);
		if (!context || !buffer) return;
		const source = context.createBufferSource();
		source.buffer = buffer;
		source.connect(context.destination);
		source.start();
	}

	ensureContext();
	const sounds = { unlock: ensureContext };
	for (const [name, fileName] of Object.entries(SOUND_FILES)) {
		sounds[name] = () => play(fileName);
	}
	sounds.applause = () => play(APPLAUSE_FILES[Math.floor(Math.random() * APPLAUSE_FILES.length)]);
	return sounds;
}
