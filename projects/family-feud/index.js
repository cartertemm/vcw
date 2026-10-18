import { escapeHtml, focusElement, announce } from "./dom-utils.js";
import { isIOS, isIOSStandalone } from "./platform.js";
import { createPool, loadQuestions } from "./data.js";
import { createAudio } from "./audio.js";
import { createLiveLink } from "./live.js";
import { boardView, teamsView, fastMoneyRows } from "./spectator-view.js";
import { scoresHtml, strikesHtml, flashStrike } from "./ui.js";
import { startSpectator } from "./spectator.js";
import {
	DEFAULT_TARGET,
	MAX_STRIKES,
	FAST_MONEY_GOAL,
	FAST_MONEY_QUESTIONS,
	multiplierForRound,
	faceOffWinner,
	createBoard,
	validateSetup,
} from "./game.js";

const MULTIPLIER_NAMES = { 1: "Regular points this round.", 2: "Double points this round!", 3: "Triple points this round!" };
const MULTIPLIER_WORDS = { 2: "double", 3: "triple" };
const STRIKE_STATUS = ["No strikes yet.", "They have 1 strike.", "They have 2 strikes. One more and the other family can steal."];
const STRIKE_CALLS = [null, "That's a strike.", "That's strike two."];

const app = document.getElementById("app");
const statusEl = document.getElementById("status");
const localAudio = createAudio();
const live = createLiveLink();
// Once a spectator screen is watching, sounds play there instead of here.
const audio = Object.fromEntries(Object.keys(localAudio).map(name => [
	name,
	() => (live.hasSpectators ? live.playSound(name) : localAudio[name]()),
]));
audio.unlock = localAudio.unlock;

let pools = null;
let showHiddenAnswers = false;
let lastFastMoneyView = null;

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

function isPlural(name) {
	return /s$/i.test(name);
}

function teamName(name, capitalize = false) {
	if (!isPlural(name) || /^the\s/i.test(name)) return name;
	return `${capitalize ? "The" : "the"} ${name}`;
}

function teamDoes(name, singularVerb, pluralVerb, capitalize = true) {
	return `${teamName(name, capitalize)} ${isPlural(name) ? pluralVerb : singularVerb}`;
}

function points(n) {
	return `${n} point${n === 1 ? "" : "s"}`;
}

function show(html, focusSelector = "h1, h2", activeTeam = null) {
	document.body.dataset.team = activeTeam ?? "";
	app.innerHTML = html;
	focusElement(app.querySelector(focusSelector));
	const quitButton = app.querySelector('[data-action="quit"]');
	if (quitButton) {
		quitButton.addEventListener("click", () => {
			if (confirmQuit()) renderMenu();
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
			<label class="inline"><input type="checkbox" id="show-hidden"> Show the hidden answers on screen</label>
			${live.available ? `<p class="watch-code">TV code: <strong>${live.code}</strong></p>` : ""}
			${quitButtonHtml()}
		</div>
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
			return `<li class="tile revealed unfound">${tileContentHtml(answer, i)}<span class="sr-only">, nobody got this one</span></li>`;
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

function onAnswerTap(handler) {
	app.querySelectorAll("[data-answer]").forEach(button => {
		button.addEventListener("click", () => handler(Number(button.dataset.answer)));
	});
}

function sendBoard(game, round, caption, { control = null, strikes = 0, showAll = false } = {}) {
	live.setView({
		screen: "board",
		teams: teamsView(game),
		question: round.board.question.question,
		caption,
		answers: boardView(round.board, showAll),
		control,
		activeTeam: control,
		strikes,
		bank: round.board.bank(),
		multiplier: round.multiplier,
	});
}

function sendFastMoney(game, fm, player, caption, question = null) {
	const playerOneHidden = question !== null && player === 1;
	lastFastMoneyView = {
		screen: "fast-money",
		teams: teamsView(game),
		team: fm.teamIndex,
		activeTeam: fm.teamIndex,
		caption,
		question,
		total: fastMoneyTotal(fm, fm.revealed),
		rows: [
			playerOneHidden ? fm.questions.map(() => null) : fastMoneyRows(fm, 0, fm.revealed[0]),
			fastMoneyRows(fm, 1, fm.revealed[1]),
		],
	};
	live.setView(lastFastMoneyView);
}

function revealMessage(board, index) {
	const answer = board.question.answers[index];
	return `${answer.text}! That's the number ${index + 1} answer, worth ${points(answer.points)}.`;
}

function renderLoading() {
	show(`<h1>Family Feud</h1><p>Loading the surveys...</p>`);
}

function renderError() {
	show(`<h1>Family Feud</h1><p>We couldn't load the surveys. Try reloading the page.</p>`);
}

function renderMenu() {
	show(`
		<h1 class="logo">Family Feud</h1>
		<p>Pick someone to host and split everyone else into two families. The host reads the questions off this phone and taps each answer someone gets right.</p>
		<button type="button" class="primary" data-action="new">New game</button>
		<button type="button" data-action="instructions">Instructions</button>
		${live.available ? `<button type="button" data-action="watch">Watch on a TV</button>` : ""}
	`);
	live.setView({ screen: "lobby" });
	on("watch", () => renderWatchEntry());
	on("new", () => {
		audio.select();
		renderSetup();
	});
	on("instructions", renderInstructions);
}

function renderWatchEntry(code = "", errorMessage = "") {
	show(`
		<h2>Watch on a TV</h2>
		<p>Open this on the device connected to your TV, then enter the code from the host's phone. The TV shows the questions, the scores, and each answer after the host reveals it.</p>
		<label for="watch-code">Game code</label>
		<input type="text" id="watch-code" autocomplete="off" autocapitalize="characters" maxlength="4">
		${errorMessage ? `<p class="error">${escapeHtml(errorMessage)}</p>` : ""}
		<button type="button" class="primary" data-action="start-watching">Start watching</button>
		<button type="button" data-action="back">Back</button>
	`);
	const input = app.querySelector("#watch-code");
	input.value = code;
	on("start-watching", async () => {
		const entered = input.value.trim().toUpperCase();
		const res = await fetch(`room/${encodeURIComponent(entered)}`).catch(() => null);
		if (!res?.ok) {
			const message = "We couldn't find a game with that code. Check the host's phone and try again.";
			announce(statusEl, message);
			renderWatchEntry(entered, message);
			return;
		}
		history.replaceState(null, "", `?watch=${entered}`);
		document.documentElement.requestFullscreen?.().catch(() => {});
		startSpectator(app, statusEl, entered);
	});
	on("back", renderMenu);
}

function renderInstructions() {
	show(`
		<article class="instructions">
			<h2>How to play</h2>
			<p><strong>Host: Read these rules out loud before you start.</strong></p>

			<h3>Get ready</h3>
			<p>Choose one person to be the host. Everyone else splits into two families. The host reads the questions and uses this screen. Players must not look at the host's screen because it can show the answers.</p>

			<h3>Face-off</h3>
			<p>One player from each family comes forward. The host reads the question. The first player to buzz in gives one answer. If it is not the top answer, the other player gets one chance. The family with the higher answer chooses to play the round or pass it to the other family.</p>

			<h3>Playing a round</h3>
			<p>The family in control answers one person at a time. Each person gives one answer without help from anyone else. An answer on the board is shown and adds points to the round. An answer that is not on the board earns a strike.</p>

			<h3>Three strikes and stealing</h3>
			<p>After three strikes, the other family gets one chance to steal. They may talk together before giving one answer. If that answer is on the board, they win all the points from the round. If it is not, the family that had control wins the points.</p>

			<h3>Scoring and winning</h3>
			<p>Only the family that wins the round gets its points. Some rounds are worth double or triple points, and the screen will say when that happens. The first family to reach the chosen winning score moves on to Fast Money.</p>

			<h3>Fast Money</h3>
			<p>The winning family chooses two players. Player 2 leaves the room and must not listen. Player 1 answers five questions. Player 2 then answers the same questions. If Player 2 repeats an answer, they must give a different one. The two players need 200 points together to win.</p>

			<h3>Keep it fair</h3>
			<p>Do not use phones, the internet, or other hints. Do not call out an answer when it is not your turn. Families may talk together only when they get a chance to steal. An answer that is already showing cannot be used again. The host decides whether an answer is close enough to one on the board. Please accept the host's decision and keep playing.</p>
		</article>
		<button type="button" class="primary" data-action="start">Start a new game</button>
		<button type="button" data-action="back">Back to the main menu</button>
	`);
	on("start", () => renderSetup());
	on("back", renderMenu);
}

function renderSetup(previous = { one: "", two: "", target: String(DEFAULT_TARGET) }, errorMessage = "") {
	show(`
		<h2>Who's playing?</h2>
		<label for="team-one">First family's name (orange)</label>
		<input type="text" id="team-one" autocomplete="off">
		<label for="team-two">Second family's name (green)</label>
		<input type="text" id="team-two" autocomplete="off">
		<label for="target">Points needed to win (the winners play Fast Money)</label>
		<input type="number" id="target" min="1" inputmode="numeric">
		${errorMessage ? `<p class="error">${escapeHtml(errorMessage)}</p>` : ""}
		<button type="button" class="primary" data-action="start">Let's play</button>
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
		${scoresHtml(game.teams)}
		<p>Bring one player from each family up for the face-off.</p>
		${live.available ? `<p class="watch-code">Want the board on a TV? Open Family Feud on the TV's device, pick Watch on a TV, and enter <strong>${live.code}</strong>.</p>` : ""}
		<button type="button" class="primary" data-action="face-off">Start the face-off</button>
		${quitButtonHtml()}
	`);
	live.setView({ screen: "round", round: game.round, caption: MULTIPLIER_NAMES[multiplier], teams: teamsView(game) });
	audio.intro();
	on("face-off", () => {
		const board = createBoard(pools.main.next());
		renderBuzzIn(game, { board, multiplier }, "");
	});
}

function renderBuzzIn(game, round, message) {
	show(`
		<h2>${escapeHtml(`Top ${round.board.question.answers.length} answers on the board. ${round.board.question.question}`)}</h2>
		${message ? `<p class="message">${escapeHtml(message)}</p>` : ""}
		<p>Read the question out loud. Which family buzzed in first?</p>
		${game.teams.map((team, i) => `<button type="button" class="team-button team-${i}" data-team="${i}">${escapeHtml(team.name)}</button>`).join("")}
		${scoresHtml(game.teams)}
		${boardHtml(round.board, "locked")}
		${hostControlsHtml()}
	`);
	sendBoard(game, round, message || "Face-off! Who's going to buzz in first?");
	app.querySelectorAll("[data-team]").forEach(button => {
		button.addEventListener("click", () => {
			audio.buzzIn();
			const first = Number(button.dataset.team);
			renderFaceOffAnswer(game, round, { first, firstRank: undefined }, `${teamName(game.teams[first].name, true)} buzzed in first!`);
		});
	});
}

function renderFaceOffAnswer(game, round, faceOff, message) {
	const answering = faceOff.firstRank === undefined ? faceOff.first : 1 - faceOff.first;
	show(`
		<h2>Face-off</h2>
		<p class="message">${escapeHtml(message)}</p>
		<p>Ask <strong>${escapeHtml(teamName(game.teams[answering].name))}</strong> for their answer. If it's on the board, tap it.</p>
		<p class="question">${escapeHtml(round.board.question.question)}</p>
		${scoresHtml(game.teams, answering)}
		${boardHtml(round.board, "tap")}
		<button type="button" class="strike-button" data-action="miss">Not on the board</button>
		${hostControlsHtml()}
	`, ".message", answering);
	sendBoard(game, round, message, { control: answering });

	function record(rank) {
		if (faceOff.firstRank === undefined) {
			faceOff.firstRank = rank;
			if (rank === 0) {
				renderPlayOrPass(game, round, faceOff.first, `${revealMessage(round.board, 0)} You can't beat that, so ${teamDoes(game.teams[1 - faceOff.first].name, "doesn't", "don't", false)} get a turn.`);
				return;
			}
			const other = game.teams[1 - faceOff.first].name;
			const next = rank === null
				? `That's not on the board. Now ${teamDoes(other, "gets", "get", false)} a turn, and any answer on the board wins it.`
				: `${revealMessage(round.board, rank)} Now ${teamDoes(other, "gets", "get", false)} a turn. They need a higher answer to win the face-off.`;
			renderFaceOffAnswer(game, round, faceOff, next);
			return;
		}
		const winner = faceOffWinner(faceOff.firstRank, rank);
		const lead = rank === null ? "That's not on the board either." : revealMessage(round.board, rank);
		if (winner === null) {
			renderBuzzIn(game, round, `${lead} Bring up the next two players and try again.`);
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
		<h2>${escapeHtml(teamDoes(game.teams[winnerIndex].name, "wins", "win"))} the face-off!</h2>
		<p class="message">${escapeHtml(message)}</p>
		<p>Do they want to play this round, or pass it to the other family?</p>
		<button type="button" class="team-button team-${winnerIndex}" data-action="play">${escapeHtml(teamDoes(game.teams[winnerIndex].name, "plays", "play"))}</button>
		<button type="button" class="team-button team-${other}" data-action="pass">Pass to ${escapeHtml(teamName(game.teams[other].name))}</button>
		${scoresHtml(game.teams, winnerIndex)}
		${boardHtml(round.board, "locked")}
		${hostControlsHtml()}
	`, "h1, h2", winnerIndex);
	sendBoard(game, round, `${teamDoes(game.teams[winnerIndex].name, "wins", "win")} the face-off! Play or pass?`, { control: winnerIndex });
	on("play", () => startMainPlay(game, round, winnerIndex));
	on("pass", () => startMainPlay(game, round, other));
}

function startMainPlay(game, round, controlIndex) {
	audio.select();
	round.control = controlIndex;
	round.strikes = 0;
	if (round.board.isCleared()) {
		awardRound(game, round, controlIndex, "That clears the board!");
		return;
	}
	renderMainPlay(game, round, `${teamDoes(game.teams[controlIndex].name, "is", "are")} playing. Go down the line and ask each player for an answer.`, "h2");
}

function bankHtml(round) {
	const bank = round.board.bank();
	const multiplied = round.multiplier > 1 ? ` (that's ${bank * round.multiplier} with ${MULTIPLIER_WORDS[round.multiplier]} points)` : "";
	return `<p class="bank">Points on the board: ${bank}${multiplied}</p>`;
}

function renderMainPlay(game, round, message, focusSelector = ".message") {
	show(`
		<h2>${escapeHtml(round.board.question.question)}</h2>
		<p class="message">${escapeHtml(message)}</p>
		<p>${escapeHtml(teamDoes(game.teams[round.control].name, "is", "are"))} in control. ${STRIKE_STATUS[round.strikes]}</p>
		${bankHtml(round)}
		${strikesHtml(round.strikes)}
		${boardHtml(round.board, "tap")}
		<button type="button" class="strike-button" data-action="strike">Strike</button>
		${scoresHtml(game.teams, round.control)}
		${hostControlsHtml()}
	`, focusSelector, round.control);
	sendBoard(game, round, message, { control: round.control, strikes: round.strikes });
	onAnswerTap(index => {
		round.board.reveal(index);
		audio.reveal();
		if (round.board.isCleared()) {
			awardRound(game, round, round.control, `${revealMessage(round.board, index)} That clears the board!`);
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
		renderMainPlay(game, round, STRIKE_CALLS[round.strikes]);
	});
}

function renderSteal(game, round) {
	const stealer = 1 - round.control;
	show(`
		<h2>${escapeHtml(teamName(game.teams[stealer].name, true))} can steal!</h2>
		<p class="message">That's three strikes. ${escapeHtml(teamName(game.teams[stealer].name, true))} can talk it over, then give one answer. If it's on the board, they take all the points.</p>
		<p class="question">${escapeHtml(round.board.question.question)}</p>
		${bankHtml(round)}
		${strikesHtml(MAX_STRIKES)}
		${boardHtml(round.board, "tap")}
		<button type="button" class="strike-button" data-action="wrong">Not on the board</button>
		${scoresHtml(game.teams, stealer)}
		${hostControlsHtml()}
	`, ".message", stealer);
	sendBoard(game, round, `${teamName(game.teams[stealer].name, true)} can steal!`, { control: stealer, strikes: MAX_STRIKES });
	onAnswerTap(index => {
		round.board.reveal(index);
		audio.reveal();
		awardRound(game, round, stealer, `${revealMessage(round.board, index)} They stole it!`);
	});
	on("wrong", () => {
		audio.strike();
		flashStrike(1);
		awardRound(game, round, round.control, `That's not on the board, so ${teamDoes(game.teams[round.control].name, "keeps", "keep", false)} the points.`);
	});
}

function awardRound(game, round, teamIndex, summary) {
	const won = round.board.bank() * round.multiplier;
	const team = game.teams[teamIndex];
	team.score += won;
	const reachedTarget = team.score >= game.target;
	show(`
		<h2>${escapeHtml(teamDoes(team.name, "wins", "win"))} ${points(won)}!</h2>
		<p class="message">${escapeHtml(summary)}</p>
		${scoresHtml(game.teams, teamIndex)}
		${reachedTarget
			? `<p>${escapeHtml(teamDoes(team.name, "has", "have"))} ${team.score} points, so they're going to Fast Money!</p>
				<button type="button" class="primary" data-action="fast-money">Play Fast Money</button>`
			: `<button type="button" class="primary" data-action="next">Next round</button>`}
		<h3>Here's the full board</h3>
		<p class="question">${escapeHtml(round.board.question.question)}</p>
		${boardHtml(round.board, "final")}
		${quitButtonHtml()}
	`, "h1, h2", teamIndex);
	sendBoard(game, round, `${teamDoes(team.name, "wins", "win")} ${points(won)}!`, { control: teamIndex, showAll: true });
	audio.applause();
	on("next", () => renderRoundIntro(game));
	on("fast-money", () => {
		const questions = Array.from({ length: FAST_MONEY_QUESTIONS }, () => pools.fastMoney.next());
		renderFastMoneyIntro(game, { teamIndex, questions, picks: [[], []], revealed: [0, 0] }, 0);
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
		? `${team}, pick two players for Fast Money. Player 2 has to leave the room so they can't hear anything. Player 1 answers ${FAST_MONEY_QUESTIONS} questions.`
		: `Bring player 2 back in. If they give the same answer as player 1, tap Duplicate and ask for another one.`;
	show(`
		<h2>Fast Money, player ${player + 1}</h2>
		<p>${escapeHtml(instructions)}</p>
		<p>Read each question and tap the answer that matches what they say, or No match if it's not on the list. Pass saves a question for the end.</p>
		<p>${escapeHtml(teamDoes(team, "needs", "need"))} ${FAST_MONEY_GOAL} points between both players to win.</p>
		<button type="button" class="primary" data-action="go">Start</button>
		${quitButtonHtml()}
	`, "h1, h2", fm.teamIndex);
	sendFastMoney(game, fm, player, player === 0
		? `${teamDoes(team, "is", "are")} playing Fast Money! Player 2, please leave the room.`
		: "Player 2, come on back in!");
	on("go", () => {
		audio.select();
		const queue = fm.questions.map((_, i) => i);
		const finish = () => renderFastMoneyReveal(game, fm, player, 0);
		renderFastMoneyQuestion(game, fm, player, queue, finish);
	});
}

function renderFastMoneyQuestion(game, fm, player, queue, finish, message = "") {
	const questionIndex = queue[0];
	const question = fm.questions[questionIndex];
	const partnerPick = player === 1 ? fm.picks[0][questionIndex] : undefined;
	show(`
		<h2>${escapeHtml(`Question ${questionIndex + 1}. ${question.question}`)}</h2>
		${message ? `<p class="message">${escapeHtml(message)}</p>` : ""}
		<div class="fm-answers">
			${question.answers.map((answer, i) => i === partnerPick
				? `<button type="button" disabled>${escapeHtml(answer.text)} (player 1's answer)</button>`
				: `<button type="button" data-answer="${i}">${escapeHtml(answer.text)}</button>`).join("")}
		</div>
		<button type="button" class="strike-button" data-action="no-match">No match</button>
		${player === 1 ? `<button type="button" data-action="duplicate">Duplicate</button>` : ""}
		${queue.length > 1 ? `<button type="button" data-action="pass">Pass</button>` : ""}
		${quitButtonHtml()}
	`, message ? ".message" : "h2", fm.teamIndex);
	sendFastMoney(game, fm, player, `Player ${player + 1} is answering.`, question.question);

	function record(pick) {
		audio.select();
		fm.picks[player][questionIndex] = pick;
		queue.shift();
		if (queue.length === 0) {
			finish();
			return;
		}
		renderFastMoneyQuestion(game, fm, player, queue, finish);
	}

	onAnswerTap(record);
	on("no-match", () => record(null));
	on("duplicate", () => {
		audio.miss();
		renderFastMoneyQuestion(game, fm, player, queue, finish, "Player 1 already said that. Ask for a different answer.");
	});
	on("pass", () => {
		queue.push(queue.shift());
		renderFastMoneyQuestion(game, fm, player, queue, finish);
	});
}

function fastMoneyLineText(fm, player, q) {
	const question = fm.questions[q];
	const pick = fm.picks[player][q];
	const top = question.answers[0];
	let said = `They said ${question.answers[pick]?.text}, worth ${points(question.answers[pick]?.points)}.`;
	if (pick === null) said = "Their answer wasn't on the survey, so no points.";
	return `${q + 1}. ${question.question} ${said} The top answer was ${top.text}, with ${top.points}.`;
}

function renderFastMoneyReveal(game, fm, player, revealedCount) {
	const counts = player === 0 ? [revealedCount, 0] : [FAST_MONEY_QUESTIONS, revealedCount];
	const total = fastMoneyTotal(fm, counts);
	if (player === 1 && total >= FAST_MONEY_GOAL) {
		renderFastMoneyEnd(game, fm, total);
		return;
	}
	fm.revealed[player] = revealedCount;
	const done = revealedCount === FAST_MONEY_QUESTIONS;
	const lines = Array.from({ length: revealedCount }, (_, q) => `<li>${escapeHtml(fastMoneyLineText(fm, player, q))}</li>`);
	const lastLine = revealedCount > 0 ? fastMoneyLineText(fm, player, revealedCount - 1) : "";
	let nextButton = `<button type="button" class="primary" data-action="reveal">Survey says</button>`;
	if (done && player === 0) nextButton = `<button type="button" class="primary" data-action="player-two">Bring player 2 back in</button>`;
	if (done && player === 1) nextButton = `<button type="button" class="primary" data-action="finish">See how they did</button>`;
	show(`
		<h2>Let's see how player ${player + 1} did</h2>
		${lastLine ? `<p class="message">${escapeHtml(lastLine)} That's ${total} so far.</p>` : `<p class="message">Tap Survey says to reveal each answer.</p>`}
		<p class="fm-total" aria-hidden="true">${total}</p>
		<ol class="fm-lines">${lines.join("")}</ol>
		${nextButton}
		${quitButtonHtml()}
	`, revealedCount > 0 ? ".message" : "h2", fm.teamIndex);
	const row = revealedCount > 0 ? fastMoneyRows(fm, player, revealedCount)[revealedCount - 1] : null;
	sendFastMoney(game, fm, player, row
		? `${row.text ? `${row.text}, ${points(row.points)}` : "No match"}. That's ${total} so far.`
		: "Survey says...");
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
		<h2>${won ? `${escapeHtml(teamDoes(team, "wins", "win"))} Fast Money!` : "So close!"}</h2>
		<p class="message">${won
			? `They scored ${total} points. That's enough to win!`
			: `${escapeHtml(teamName(team, true))} scored ${total} points, but they needed ${FAST_MONEY_GOAL}.`}</p>
		<p class="fm-total" aria-hidden="true">${total}</p>
		${scoresHtml(game.teams, fm.teamIndex)}
		<button type="button" class="primary" data-action="again">Play again</button>
		<button type="button" data-action="menu">Back to the main menu</button>
	`, "h1, h2", fm.teamIndex);
	live.setView({
		screen: "fast-money-end",
		teams: teamsView(game),
		team: fm.teamIndex,
		activeTeam: fm.teamIndex,
		caption: won ? `${teamDoes(team, "wins", "win")} Fast Money!` : `So close! ${teamName(team, true)} needed ${FAST_MONEY_GOAL}.`,
		total,
	});
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
	await live.start();
	const watchCode = new URLSearchParams(location.search).get("watch");
	if (watchCode && live.available) {
		renderWatchEntry(watchCode.toUpperCase());
		return;
	}
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
