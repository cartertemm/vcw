export const MAX_HEADLINE_LENGTH = 200;

export function parseHeadlines(rawText, label) {
	return rawText
		.split("\n")
		.map(line => line.trim())
		.filter(line => line.length > 0 && line.length <= MAX_HEADLINE_LENGTH)
		.map(text => ({ text, label }));
}

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

export async function loadDeck() {
	const [satireText, realText] = await Promise.all([
		fetch("onion_titles.normalized.txt").then(response => response.text()),
		fetch("nottheonion_titles.normalized.txt").then(response => response.text())
	]);
	const satire = parseHeadlines(satireText, "satire");
	const real = parseHeadlines(realText, "real");
	return makeDeck(real, satire);
}
