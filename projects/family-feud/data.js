export function shuffle(list, randomFn = Math.random) {
	const result = list.slice();
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(randomFn() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function createPool(items, randomFn = Math.random) {
	let pool = shuffle(items, randomFn);
	let index = 0;
	return {
		next() {
			if (index >= pool.length) {
				pool = shuffle(items, randomFn);
				index = 0;
			}
			return pool[index++];
		},
	};
}

export function cleanQuestions(questions) {
	return questions
		.map(q => ({
			question: q.question,
			answers: q.answers
				.filter(a => Number.isInteger(a.points) && a.points > 0)
				.sort((a, b) => b.points - a.points),
		}))
		.filter(q => q.answers.length > 0);
}

export async function loadQuestions(fetchFn = fetch) {
	const res = await fetchFn("data/questions.json");
	if (!res.ok) {
		throw new Error("Failed to load questions");
	}
	return cleanQuestions(await res.json());
}
