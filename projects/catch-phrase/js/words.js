export const CATEGORIES = [
	{ slug: 'everything', name: 'Everything' },
	{ slug: 'around-the-world', name: 'Around the World' },
	{ slug: 'fun-and-games', name: 'Fun and Games' },
	{ slug: 'on-the-air', name: 'On the Air' },
	{ slug: 'snack-time', name: 'Snack Time' },
	{ slug: 'the-great-outdoors', name: 'The Great Outdoors' },
	{ slug: 'after-dark', name: 'After Dark' },
	{ slug: 'anything-goes', name: 'Anything Goes' },
];

const COMPUTED_SLUGS = ['everything', 'anything-goes'];

export function createDeck(words, rng = Math.random) {
	let remaining = [];
	function reshuffle() {
		remaining = [...words];
		for (let i = remaining.length - 1; i > 0; i--) {
			const j = Math.floor(rng() * (i + 1));
			[remaining[i], remaining[j]] = [remaining[j], remaining[i]];
		}
	}
	return {
		draw() {
			if (remaining.length === 0) reshuffle();
			return remaining.pop();
		},
	};
}

export async function loadWordLists(fetchFn = fetch) {
	const lists = new Map();
	const failures = [];
	for (const { slug } of CATEGORIES) {
		if (COMPUTED_SLUGS.includes(slug)) continue;
		try {
			const res = await fetchFn(`data/${slug}.json`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			lists.set(slug, await res.json());
		} catch {
			failures.push(slug);
		}
	}
	const fetched = [...lists.entries()];
	lists.set('anything-goes', fetched.flatMap(([, words]) => words));
	lists.set('everything', fetched.filter(([slug]) => slug !== 'after-dark').flatMap(([, words]) => words));
	return { lists, failures };
}
