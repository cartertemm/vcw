import { readFile } from 'node:fs/promises';

const SLUGS = ['around-the-world', 'fun-and-games', 'on-the-air', 'snack-time', 'the-great-outdoors', 'after-dark'];
const MIN_WORDS = 500;
const MIN_WORDS_OVERRIDES = { 'after-dark': 100 };
const MAX_PHRASE_WORDS = 4;

const seen = new Map();
let failed = false;

function fail(message) {
	console.error(`FAIL: ${message}`);
	failed = true;
}

for (const slug of SLUGS) {
	const words = JSON.parse(await readFile(new URL(`../data/${slug}.json`, import.meta.url), 'utf8'));
	const minWords = MIN_WORDS_OVERRIDES[slug] ?? MIN_WORDS;
	if (!Array.isArray(words)) fail(`${slug}: not an array`);
	if (words.length < minWords) fail(`${slug}: only ${words.length} phrases (need ${minWords})`);
	for (const word of words) {
		if (typeof word !== 'string' || word.trim() !== word || word.length === 0) {
			fail(`${slug}: bad entry ${JSON.stringify(word)}`);
			continue;
		}
		if (word.split(/\s+/).length > MAX_PHRASE_WORDS) {
			fail(`${slug}: "${word}" exceeds ${MAX_PHRASE_WORDS} words`);
		}
		const key = word.toLowerCase();
		if (seen.has(key)) fail(`${slug}: "${word}" duplicates entry in ${seen.get(key)}`);
		seen.set(key, slug);
	}
	console.log(`${slug}: ${words.length} phrases`);
}

process.exit(failed ? 1 : 0);
