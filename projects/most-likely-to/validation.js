export function parsePlayerNames(rawText) {
	return rawText
		.split("\n")
		.map(line => line.trim())
		.filter(line => line.length > 0);
}

export function validateSetup(rawNamesText, rawTargetScore) {
	const names = parsePlayerNames(rawNamesText);

	if (names.length < 2) {
		return { valid: false, error: "Enter at least 2 player names." };
	}

	const seen = new Set();
	for (const name of names) {
		const key = name.toLowerCase();
		if (seen.has(key)) {
			return { valid: false, error: "Player names must be unique." };
		}
		seen.add(key);
	}

	const targetScore = Number(rawTargetScore);
	if (!Number.isFinite(targetScore) || targetScore < 1) {
		return { valid: false, error: "Target score must be at least 1." };
	}

	return { valid: true, names, targetScore };
}
