import { isIOS, isIOSStandalone } from './platform.js';
import { CATEGORIES, createDeck, loadWordLists } from './words.js';
import { createGame } from './game.js';
import { createAudio, createRoundTimer } from './audio.js';

function setupGate() {
	const gate = document.getElementById('install-gate');
	const app = document.getElementById('app');
	if (isIOS() && !isIOSStandalone()) {
		gate.hidden = false;
		const continueButton = document.getElementById('continue-anyway');
		continueButton.focus();
		continueButton.addEventListener('click', () => {
			gate.hidden = true;
			app.hidden = false;
		});
	} else {
		app.hidden = false;
	}
}

const BUTTON_IDS = ['category', 'timer', 'next', 'team1', 'team2'];

async function init() {
	setupGate();
	// Reading navigator.serviceWorker throws a SecurityError in sandboxed
	// iframes (opaque origin), e.g. the VibeCode Weekly demo runner.
	try {
		navigator.serviceWorker.register('sw.js').catch(() => {});
	} catch (e) {}

	const statusEl = document.getElementById('status');
	const wordEl = document.getElementById('word');

	// Buttons stay disabled while word lists load over the network, so a slow
	// connection reads as "loading" instead of silently doing nothing on tap.
	for (const id of BUTTON_IDS) {
		document.getElementById(id).disabled = true;
	}
	wordEl.textContent = 'Loading word lists…';

	const { lists, failures } = await loadWordLists();
	const categories = CATEGORIES.filter((c) => (lists.get(c.slug) || []).length > 0);
	if (failures.length) {
		statusEl.textContent = `Some word lists failed to load: ${failures.join(', ')}`;
	}
	if (categories.length === 0) {
		wordEl.textContent = 'No word lists could be loaded. Reconnect and reload.';
		return;
	}
	wordEl.textContent = 'Press Timer to start';

	const decks = new Map();
	function drawWord(categoryIndex) {
		const slug = categories[categoryIndex].slug;
		if (!decks.has(slug)) {
			decks.set(slug, createDeck(lists.get(slug)));
		}
		return decks.get(slug).draw();
	}

	const audio = createAudio();
	const categoryNameEl = document.getElementById('category-name');
	const score1El = document.getElementById('score1');
	const score2El = document.getElementById('score2');

	let clearStatusTimer = null;
	function speak(text) {
		clearTimeout(clearStatusTimer);
		statusEl.textContent = text;
		clearStatusTimer = setTimeout(() => {
			statusEl.textContent = '';
		}, 300);
	}

	const game = createGame({
		categories: categories.map((c) => c.name),
		drawWord,
		timer: createRoundTimer(audio),
		display(text) {
			wordEl.textContent = text;
		},
		announce: speak,
		updateScores(team1, team2) {
			score1El.textContent = team1;
			score2El.textContent = team2;
		},
		playFanfare: () => audio.fanfare(),
	});

	document.addEventListener('pointerdown', () => audio.unlock(), { once: true });
	document.addEventListener('keydown', () => audio.unlock(), { once: true });

	document.getElementById('timer').addEventListener('click', () => game.pressTimer());
	document.getElementById('next').addEventListener('click', () => game.pressNext());
	document.getElementById('team1').addEventListener('click', () => game.pressTeam(0));
	document.getElementById('team2').addEventListener('click', () => game.pressTeam(1));
	document.getElementById('category').addEventListener('click', () => {
		game.pressCategory();
		categoryNameEl.textContent = categories[game.categoryIndex].name;
	});

	for (const id of BUTTON_IDS) {
		document.getElementById(id).disabled = false;
	}
}

init();
