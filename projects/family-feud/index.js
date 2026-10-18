import { escapeHtml, focusElement, announce } from "./dom-utils.js";
import { isIOS, isIOSStandalone } from "./platform.js";
import { createPool, loadQuestions } from "./data.js";
import { createAudio } from "./audio.js";
import {
	DEFAULT_TARGET,
	MAX_STRIKES,
	FAST_MONEY_GOAL,
	FAST_MONEY_QUESTIONS,
	FAST_MONEY_SECONDS,
	multiplierForRound,
	faceOffWinner,
	createBoard,
	validateSetup,
} from "./game.js";

const MULTIPLIER_NAMES = { 1: "Single points", 2: "Double points", 3: "Triple points" };
const TICK_SECONDS = 5;
const ONE_SECOND_MS = 1000;
const STRIKE_FLASH_MS = 900;

const app = document.getElementById("app");
const statusEl = document.getElementById("status");
const audio = createAudio();

let pools = null;
let showHiddenAnswers = false;
let timerId = null;

function setupGate() {
	const gate = document.getElementById("install-gate");
	if (isIOS() && !isIOSStandalone()) {
		gate.hidden = false;
		const continueButton = document.getElementById("continue-anyway");
		focusElement(continueButton);
		continueButton.addEventListener("click", () => {
			gate.hidden = true;
			app.hidden = false;
		});
	} else {
		app.hidden = false;
	}
}

function confirmQuit() {
	return window.confirm(
		"Are you sure you would like to quit the current game and go back to the main menu? All progress will be lost"
	);
}

function stopTimer() {
	clearInterval(timerId);
	timerId = null;
}

function points(n) {
	return `${n} point${n === 1 ? "" : "s"}`;
}

function show(html, focusSelector = "h1, h2") {
	app.innerHTML = html;
	focusElement(app.querySelector(focusSelector));
	const quitButton = app.querySelector('[data-action="quit"]');
	if (quitButton) {
		quitButton.addEventListener("click", () => {
			if (confirmQuit()) {
				stopTimer();
				renderMenu();
			}
		});
	}
	const hostToggle = app.querySelector("#show-hidden");
	if (hostToggle) {
		hostToggle.checked = showHiddenAnswers;
		hostToggle.addEventListener("change", () => {
			showHiddenAnswers = hostToggle.checked;
			app.querySelector(".board")?.classList.toggle("host-view", showHiddenAnswers);
		});
	}
}

function on(action, handler) {
	app.querySelectorAll(`[data-action="${action}"]`).forEach(el => el.addEventListener("click", handler));
}

function quitButtonHtml() {
	return `<button type="button" class="quiet" data-action="quit">Quit game</button>`;
}

function hostControlsHtml() {
	return `
		<div class="host-controls">
			<label class="inline"><input type="checkbox" id="show-hidden"> Show hidden answers on screen</label>
			${quitButtonHtml()}
		</div>
	`;
}

function scoresHtml(game, controlIndex = null) {
	return `
		<section class="scores" aria-label="Scores">
			${game.teams.map((team, i) => `
				<div class="team${i === controlIndex ? " in-control" : ""}">
					<span class="team-name">${escapeHtml(team.name)}</span>
					<span class="team-score">${team.score}</span>
				</div>
			`).join("")}
		</section>
	`;
}

function tileContentHtml(answer, index) {
	return `<span class="num">${index + 1}</span><span class="answer-text">${escapeHtml(answer.text)}</span><span class="answer-points">${answer.points}</span>`;
}

// mode: "locked" shows hidden tiles without buttons, "tap" makes hidden tiles
// buttons, "final" shows every answer and marks the ones nobody found.
function boardHtml(board, mode) {
	const tiles = board.question.answers.map((answer, i) => {
		if (board.isRevealed(i)) {
			return `<li class="tile revealed">${tileContentHtml(answer, i)}</li>`;
		}
		if (mode === "final") {
			return `<li class="tile revealed unfound">${tileContentHtml(answer, i)}<span class="sr-only">, not found</span></li>`;
		}
		const content = `${tileContentHtml(answer, i)}<span class="sr-only">, hidden</span>`;
		if (mode === "tap") {
			return `<li class="tile hidden-answer"><button type="button" data-answer="${i}">${content}</button></li>`;
		}
		return `<li class="tile hidden-answer">${content}</li>`;
	});
	const hostClass = showHiddenAnswers && mode !== "final" ? " host-view" : "";
	return `<ol class="board${hostClass}" aria-label="Survey board">${tiles.join("")}</ol>`;
}

function strikesHtml(count) {
	return `<div class="strikes" aria-hidden="true">${"<span>X</span>".repeat(count)}</div>`;
}

function flashStrike(count) {
	document.querySelector(".strike-flash")?.remove();
	const overlay = document.createElement("div");
	overlay.className = "strike-flash";
	overlay.setAttribute("aria-hidden", "true");
	overlay.innerHTML = "<span>X</span>".repeat(count);
	document.body.appendChild(overlay);
	setTimeout(() => overlay.remove(), STRIKE_FLASH_MS);
}

function onAnswerTap(handler) {
	app.querySelectorAll("[data-answer]").forEach(button => {
		button.addEventListener("click", () => handler(Number(button.dataset.answer)));
	});
}

function revealMessage(board, index) {
	const answer = board.question.answers[index];
	return `Number ${index + 1}, ${answer.text}, ${points(answer.points)}.`;
}

function renderLoading() {
	show(`<h1>Family Feud</h1><p>Loading surveys...</p>`);
}

function renderError() {
	show(`<h1>Family Feud</h1><p>Could not load the surveys. Reload the page.</p>`);
}

function renderMenu() {
	show(`
		<h1 class="logo">Family Feud</h1>
		<p>Two teams. One host. One hundred people surveyed. The host holds this device, reads each question, and taps the answers as the teams say them.</p>
		<p>Tip: the hidden answers are read by your screen reader, so use one earbud to keep them secret.</p>
		<button type="button" class="primary" data-action="new">New game</button>
	`);
	on("new", () => {
		audio.select();
		renderSetup();
	});
}

function renderSetup(previous = { one: "", two: "", target: String(DEFAULT_TARGET) }, errorMessage = "") {
	show(`
		<h2>New game</h2>
		<label for="team-one">First family</label>
		<input type="text" id="team-one" autocomplete="off">
		<label for="team-two">Second family</label>
		<input type="text" id="team-two" autocomplete="off">
		<label for="target">Points to win and play Fast Money</label>
		<input type="number" id="target" min="1" inputmode="numeric">
		${errorMessage ? `<p class="error">${escapeHtml(errorMessage)}</p>` : ""}
		<button type="button" class="primary" data-action="start">Start game</button>
		<button type="button" data-action="back">Back</button>
	`);
	app.querySelector("#team-one").value = previous.one;
	app.querySelector("#team-two").value = previous.two;
	app.querySelector("#target").value = previous.target;
	on("start", () => {
		const entered = {
			one: app.querySelector("#team-one").value,
			two: app.querySelector("#team-two").value,
			target: app.querySelector("#target").value,
		};
		const result = validateSetup(entered.one, entered.two, entered.target);
		if (!result.valid) {
			announce(statusEl, result.error);
			renderSetup(entered, result.error);
			return;
		}
		audio.applauseStart();
		renderRoundIntro({
			teams: result.teams.map(name => ({ name, score: 0 })),
			target: result.target,
			round: 0,
		});
	});
	on("back", renderMenu);
}

function renderRoundIntro(game) {
	game.round++;
	const multiplier = multiplierForRound(game.round);
	show(`
		<h2>Round ${game.round}</h2>
		<p class="multiplier">${MULTIPLIER_NAMES[multiplier]}</p>
		${scoresHtml(game)}
		<p>Call one player from each family up to the podium.</p>
		<button type="button" class="primary" data-action="face-off">Start the face-off</button>
		${quitButtonHtml()}
	`);
	audio.intro();
	on("face-off", () => {
		const board = createBoard(pools.main.next());
		renderBuzzIn(game, { board, multiplier }, "");
	});
}

function renderBuzzIn(game, round, message) {
	show(`
		<h2>${escapeHtml(round.board.question.answers.length + " answers on the board. " + round.board.question.question)}</h2>
		${message ? `<p class="message">${escapeHtml(message)}</p>` : ""}
		<p>Read the question. Who buzzed in first?</p>
		${game.teams.map((team, i) => `<button type="button" class="primary" data-team="${i}">${escapeHtml(team.name)}</button>`).join("")}
		${scoresHtml(game)}
		${boardHtml(round.board, "locked")}
		${hostControlsHtml()}
	`);
	app.querySelectorAll("[data-team]").forEach(button => {
		button.addEventListener("click", () => {
			audio.buzzIn();
			const first = Number(button.dataset.team);
			renderFaceOffAnswer(game, round, { first, firstRank: undefined }, `${game.teams[first].name} buzzed in first.`);
		});
	});
}

function renderFaceOffAnswer(game, round, faceOff, message) {
	const answering = faceOff.firstRank === undefined ? faceOff.first : 1 - faceOff.first;
	show(`
		<h2>Face-off</h2>
		<p class="message">${escapeHtml(message)}</p>
		<p><strong>${escapeHtml(game.teams[answering].name)}</strong> answers. Tap their answer if it is on the board.</p>
		<p class="question">${escapeHtml(round.board.question.question)}</p>
		${scoresHtml(game, answering)}
		${boardHtml(round.board, "tap")}
		<button type="button" class="strike-button" data-action="miss">Not on the board</button>
		${hostControlsHtml()}
	`, ".message");

	function record(rank) {
		if (faceOff.firstRank === undefined) {
			faceOff.firstRank = rank;
			if (rank === 0) {
				renderPlayOrPass(game, round, faceOff.first, `${revealMessage(round.board, 0)} That is the top answer.`);
				return;
			}
			const lead = rank === null ? "Not on the board." : revealMessage(round.board, rank);
			renderFaceOffAnswer(game, round, faceOff, `${lead} ${game.teams[1 - faceOff.first].name} can beat it.`);
			return;
		}
		const winner = faceOffWinner(faceOff.firstRank, rank);
		const lead = rank === null ? "Not on the board." : revealMessage(round.board, rank);
		if (winner === null) {
			renderBuzzIn(game, round, `${lead} Neither answer is on the board. Call up the next two players.`);
			return;
		}
		const winnerIndex = winner === "first" ? faceOff.first : 1 - faceOff.first;
		renderPlayOrPass(game, round, winnerIndex, lead);
	}

	onAnswerTap(index => {
		round.board.reveal(index);
		audio.reveal();
		record(index);
	});
	on("miss", () => {
		audio.strike();
		flashStrike(1);
		record(null);
	});
}

function renderPlayOrPass(game, round, winnerIndex, message) {
	const other = 1 - winnerIndex;
	show(`
		<h2>${escapeHtml(game.teams[winnerIndex].name)} wins the face-off</h2>
		<p class="message">${escapeHtml(message)}</p>
		<p>Play or pass?</p>
		<button type="button" class="primary" data-action="play">${escapeHtml(game.teams[winnerIndex].name)} plays</button>
		<button type="button" data-action="pass">Pass to ${escapeHtml(game.teams[other].name)}</button>
		${scoresHtml(game, winnerIndex)}
		${boardHtml(round.board, "locked")}
		${hostControlsHtml()}
	`);
	on("play", () => startMainPlay(game, round, winnerIndex));
	on("pass", () => startMainPlay(game, round, other));
}

function startMainPlay(game, round, controlIndex) {
	audio.select();
	round.control = controlIndex;
	round.strikes = 0;
	if (round.board.isCleared()) {
		awardRound(game, round, controlIndex, "The board is clear.");
		return;
	}
	renderMainPlay(game, round, `${game.teams[controlIndex].name} has control. Ask each player in turn.`, "h2");
}

function bankHtml(round) {
	const bank = round.board.bank();
	const multiplied = round.multiplier > 1 ? `, times ${round.multiplier} is ${bank * round.multiplier}` : "";
	return `<p class="bank">Bank: ${bank}${multiplied}</p>`;
}

function renderMainPlay(game, round, message, focusSelector = ".message") {
	show(`
		<h2>${escapeHtml(round.board.question.question)}</h2>
		<p class="message">${escapeHtml(message)}</p>
		<p>${escapeHtml(game.teams[round.control].name)} has control. Strikes: ${round.strikes} of ${MAX_STRIKES}.</p>
		${bankHtml(round)}
		${strikesHtml(round.strikes)}
		${boardHtml(round.board, "tap")}
		<button type="button" class="strike-button" data-action="strike">Strike</button>
		${scoresHtml(game, round.control)}
		${hostControlsHtml()}
	`, focusSelector);
	onAnswerTap(index => {
		round.board.reveal(index);
		audio.reveal();
		if (round.board.isCleared()) {
			awardRound(game, round, round.control, `${revealMessage(round.board, index)} The board is clear.`);
			return;
		}
		renderMainPlay(game, round, revealMessage(round.board, index));
	});
	on("strike", () => {
		round.strikes++;
		audio.strike();
		flashStrike(round.strikes);
		if (round.strikes >= MAX_STRIKES) {
			renderSteal(game, round);
			return;
		}
		renderMainPlay(game, round, `Strike ${round.strikes}.`);
	});
}

function renderSteal(game, round) {
	const stealer = 1 - round.control;
	show(`
		<h2>${escapeHtml(game.teams[stealer].name)} can steal</h2>
		<p class="message">Three strikes. ${escapeHtml(game.teams[stealer].name)} can confer and give one answer to steal the bank.</p>
		<p class="question">${escapeHtml(round.board.question.question)}</p>
		${bankHtml(round)}
		${strikesHtml(MAX_STRIKES)}
		${boardHtml(round.board, "tap")}
		<button type="button" class="strike-button" data-action="wrong">Not on the board</button>
		${scoresHtml(game, stealer)}
		${hostControlsHtml()}
	`, ".message");
	onAnswerTap(index => {
		round.board.reveal(index);
		audio.reveal();
		awardRound(game, round, stealer, `${revealMessage(round.board, index)} Steal!`);
	});
	on("wrong", () => {
		audio.strike();
		flashStrike(1);
		awardRound(game, round, round.control, `Not on the board. ${game.teams[round.control].name} keeps the bank.`);
	});
}

function awardRound(game, round, teamIndex, summary) {
	const won = round.board.bank() * round.multiplier;
	const team = game.teams[teamIndex];
	team.score += won;
	const reachedTarget = team.score >= game.target;
	show(`
		<h2>${escapeHtml(team.name)} wins ${points(won)}</h2>
		<p class="message">${escapeHtml(summary)}</p>
		${scoresHtml(game, teamIndex)}
		${reachedTarget
			? `<p>${escapeHtml(team.name)} reached ${game.target} and plays Fast Money!</p>
				<button type="button" class="primary" data-action="fast-money">Play Fast Money</button>`
			: `<button type="button" class="primary" data-action="next">Next round</button>`}
		<h3>The full board</h3>
		<p class="question">${escapeHtml(round.board.question.question)}</p>
		${boardHtml(round.board, "final")}
		${quitButtonHtml()}
	`);
	audio.applause();
	on("next", () => renderRoundIntro(game));
	on("fast-money", () => {
		const questions = Array.from({ length: FAST_MONEY_QUESTIONS }, () => pools.fastMoney.next());
		renderFastMoneyIntro(game, { teamIndex, questions, picks: [[], []] }, 0);
	});
}

function fastMoneyTotal(fm, revealedCounts = [FAST_MONEY_QUESTIONS, FAST_MONEY_QUESTIONS]) {
	let total = 0;
	fm.picks.forEach((picks, player) => {
		for (let q = 0; q < revealedCounts[player]; q++) {
			const pick = picks[q];
			if (pick !== undefined && pick !== null) total += fm.questions[q].answers[pick].points;
		}
	});
	return total;
}

function renderFastMoneyIntro(game, fm, player) {
	const team = game.teams[fm.teamIndex].name;
	const instructions = player === 0
		? `Pick two players from ${team}. Send player 2 out of the room so they cannot hear. Player 1 has ${FAST_MONEY_SECONDS[0]} seconds to answer ${FAST_MONEY_QUESTIONS} questions.`
		: `Bring player 2 back. They have ${FAST_MONEY_SECONDS[1]} seconds. If they repeat an answer from player 1, tap Duplicate and ask again.`;
	show(`
		<h2>Fast Money, player ${player + 1}</h2>
		<p>${escapeHtml(instructions)}</p>
		<p>Read each question. Tap the answer that matches, or No match. Points stay hidden until the reveal. Pass skips a question and comes back to it.</p>
		<p>${escapeHtml(team)} needs ${FAST_MONEY_GOAL} points together to win.</p>
		<button type="button" class="primary" data-action="go">Start the clock</button>
		${quitButtonHtml()}
	`);
	on("go", () => {
		audio.select();
		const queue = fm.questions.map((_, i) => i);
		let secondsLeft = FAST_MONEY_SECONDS[player];
		const finish = () => {
			stopTimer();
			renderFastMoneyReveal(game, fm, player, 0);
		};
		timerId = setInterval(() => {
			secondsLeft--;
			const timerEl = app.querySelector(".timer");
			if (timerEl) timerEl.textContent = secondsLeft;
			if (secondsLeft <= 0) {
				audio.strike();
				announce(statusEl, "Time is up.");
				finish();
			} else if (secondsLeft <= TICK_SECONDS) {
				audio.tick();
			}
		}, ONE_SECOND_MS);
		renderFastMoneyQuestion(game, fm, player, queue, () => secondsLeft, finish);
	});
}

function renderFastMoneyQuestion(game, fm, player, queue, getSecondsLeft, finish, message = "") {
	const questionIndex = queue[0];
	const question = fm.questions[questionIndex];
	const partnerPick = player === 1 ? fm.picks[0][questionIndex] : undefined;
	show(`
		<p class="timer-box">Time left: <span class="timer">${getSecondsLeft()}</span></p>
		<h2>${escapeHtml(`Question ${questionIndex + 1}. ${question.question}`)}</h2>
		${message ? `<p class="message">${escapeHtml(message)}</p>` : ""}
		<div class="fm-answers">
			${question.answers.map((answer, i) => i === partnerPick
				? `<button type="button" disabled>${escapeHtml(answer.text)} (player 1 said this)</button>`
				: `<button type="button" data-answer="${i}">${escapeHtml(answer.text)}</button>`).join("")}
		</div>
		<button type="button" class="strike-button" data-action="no-match">No match</button>
		${player === 1 ? `<button type="button" data-action="duplicate">Duplicate</button>` : ""}
		<button type="button" data-action="pass">Pass</button>
		${quitButtonHtml()}
	`, message ? ".message" : "h2");

	function record(pick) {
		audio.select();
		fm.picks[player][questionIndex] = pick;
		queue.shift();
		if (queue.length === 0) {
			finish();
			return;
		}
		renderFastMoneyQuestion(game, fm, player, queue, getSecondsLeft, finish);
	}

	onAnswerTap(record);
	on("no-match", () => record(null));
	on("duplicate", () => {
		audio.miss();
		renderFastMoneyQuestion(game, fm, player, queue, getSecondsLeft, finish, "Duplicate. Try again.");
	});
	on("pass", () => {
		queue.push(queue.shift());
		renderFastMoneyQuestion(game, fm, player, queue, getSecondsLeft, finish);
	});
}

function fastMoneyLineText(fm, player, q) {
	const question = fm.questions[q];
	const pick = fm.picks[player][q];
	const top = question.answers[0];
	const said = pick === undefined ? "No answer, 0 points" : pick === null ? "No match, 0 points" : `${question.answers[pick].text}, ${points(question.answers[pick].points)}`;
	return `${q + 1}. ${question.question} ${said}. Top answer: ${top.text}, ${top.points}.`;
}

function renderFastMoneyReveal(game, fm, player, revealedCount) {
	const counts = player === 0 ? [revealedCount, 0] : [FAST_MONEY_QUESTIONS, revealedCount];
	const total = fastMoneyTotal(fm, counts);
	if (player === 1 && total >= FAST_MONEY_GOAL) {
		renderFastMoneyEnd(game, fm, total);
		return;
	}
	const done = revealedCount === FAST_MONEY_QUESTIONS;
	const lines = Array.from({ length: revealedCount }, (_, q) => `<li>${escapeHtml(fastMoneyLineText(fm, player, q))}</li>`);
	const lastLine = revealedCount > 0 ? fastMoneyLineText(fm, player, revealedCount - 1) : "";
	let nextButton = `<button type="button" class="primary" data-action="reveal">Survey says</button>`;
	if (done && player === 0) nextButton = `<button type="button" class="primary" data-action="player-two">Bring out player 2</button>`;
	if (done && player === 1) nextButton = `<button type="button" class="primary" data-action="finish">See the result</button>`;
	show(`
		<h2>Player ${player + 1} reveal</h2>
		${lastLine ? `<p class="message">${escapeHtml(lastLine)} Total: ${total}.</p>` : `<p class="message">Let's see what the survey said.</p>`}
		<p class="fm-total" aria-hidden="true">${total}</p>
		<ol class="fm-lines">${lines.join("")}</ol>
		${nextButton}
		${quitButtonHtml()}
	`, revealedCount > 0 ? ".message" : "h2");
	on("reveal", () => {
		const pick = fm.picks[player][revealedCount];
		if (pick === undefined || pick === null) {
			audio.miss();
		} else {
			audio.ding();
		}
		renderFastMoneyReveal(game, fm, player, revealedCount + 1);
	});
	on("player-two", () => renderFastMoneyIntro(game, fm, 1));
	on("finish", () => renderFastMoneyEnd(game, fm, total));
}

function renderFastMoneyEnd(game, fm, total) {
	const team = game.teams[fm.teamIndex].name;
	const won = total >= FAST_MONEY_GOAL;
	show(`
		<h2>${won ? `${escapeHtml(team)} wins Fast Money!` : `${escapeHtml(team)} falls short`}</h2>
		<p class="message">${won
			? `They scored ${total} points. That is ${FAST_MONEY_GOAL} or more!`
			: `They scored ${total} points. They needed ${FAST_MONEY_GOAL}.`}</p>
		<p class="fm-total" aria-hidden="true">${total}</p>
		${scoresHtml(game, fm.teamIndex)}
		<button type="button" class="primary" data-action="again">Play again</button>
		<button type="button" data-action="menu">Back to menu</button>
	`);
	if (won) {
		audio.win();
	} else {
		audio.applause();
	}
	on("again", () => {
		audio.applauseStart();
		renderRoundIntro({ teams: game.teams.map(t => ({ name: t.name, score: 0 })), target: game.target, round: 0 });
	});
	on("menu", renderMenu);
}

async function main() {
	setupGate();
	// Reading navigator.serviceWorker throws a SecurityError in sandboxed
	// iframes (opaque origin), e.g. the VibeCode Weekly demo runner.
	try {
		navigator.serviceWorker.register("sw.js").catch(() => {});
	} catch (e) {}
	document.addEventListener("pointerdown", () => audio.unlock(), { once: true });
	document.addEventListener("keydown", () => audio.unlock(), { once: true });

	renderLoading();
	try {
		const questions = await loadQuestions();
		pools = { main: createPool(questions.main), fastMoney: createPool(questions.fastMoney) };
	} catch (error) {
		renderError();
		return;
	}
	renderMenu();
}

main();
