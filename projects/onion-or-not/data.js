export const MAX_HEADLINE_LENGTH = 200;

export function parseHeadlines(rawText, label) {
	return rawText
		.split("\n")
		.map(line => line.trim())
		.filter(line => line.length > 0 && line.length <= MAX_HEADLINE_LENGTH)
		.map(text => ({ text, label }));
}
