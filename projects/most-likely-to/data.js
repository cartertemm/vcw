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
