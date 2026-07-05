export const WIN_SCORE = 7;

export function createGame({ categories, drawWord, timer, display, announce, updateScores, playFanfare }) {
	let state = 'idle';
	let categoryIndex = 0;
	let scores = [0, 0];

	function beginRound() {
		state = 'round';
		display(drawWord(categoryIndex));
		timer.start(onExpire);
	}

	function onExpire() {
		state = 'ended';
		display("Time's up");
	}

	return {
		pressTimer() {
			if (state === 'round') {
				timer.stop();
				state = 'ended';
				display('Stopped');
			} else if (state === 'win') {
				scores = [0, 0];
				updateScores(scores[0], scores[1]);
				beginRound();
			} else {
				beginRound();
			}
		},
		pressNext() {
			if (state !== 'round') return;
			display(drawWord(categoryIndex));
		},
		pressCategory() {
			if (state === 'round') return;
			categoryIndex = (categoryIndex + 1) % categories.length;
			announce(categories[categoryIndex]);
		},
		pressTeam(team) {
			if (state === 'win') return;
			scores[team] += 1;
			updateScores(scores[0], scores[1]);
			if (scores[team] >= WIN_SCORE) {
				if (state === 'round') timer.stop();
				state = 'win';
				playFanfare();
				display(`Team ${team + 1} wins!`);
			} else {
				announce(`Team ${team + 1}: ${scores[team]}`);
			}
		},
		get state() {
			return state;
		},
		get categoryIndex() {
			return categoryIndex;
		},
		get scores() {
			return [...scores];
		},
	};
}
