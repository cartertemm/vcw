import { escapeHtml, announce } from "./dom-utils.js";
import { createAudio } from "./audio.js";
import { scoresHtml, strikesHtml, flashStrike } from "./ui.js";

function boardHtml(answers, previous) {
	const tiles = answers.map((answer, i) => {
		const num = `<span class="num">${i + 1}</span>`;
		if (!answer) return `<li class="tile hidden-answer">${num}</li>`;
		const isNew = previous && !previous[i];
		return `<li class="tile revealed${answer.found ? "" : " unfound"}${isNew ? " just-revealed" : ""}">${num}<span class="answer-text">${escapeHtml(answer.text)}</span><span class="answer-points">${answer.points}</span></li>`;
	});
	return `<ol class="board" aria-label="Survey board">${tiles.join("")}</ol>`;
}

function fastMoneyColumnHtml(label, rows) {
	return `
		<section class="fm-column" aria-label="${label}">
			<h2>${label}</h2>
			<ol class="fm-rows">
				${rows.map(row => row
					? `<li class="tile revealed"><span class="answer-text">${escapeHtml(row.text || "No match")}</span><span class="answer-points">${row.points}</span></li>`
					: `<li class="tile hidden-answer"></li>`).join("")}
			</ol>
		</section>
	`;
}

function viewHtml(view, previous) {
	switch (view.screen) {
		case "round":
			return `
				<h1>Round ${view.round}</h1>
				<p class="multiplier">${escapeHtml(view.caption)}</p>
				${scoresHtml(view.teams)}
			`;
		case "board":
			return `
				${scoresHtml(view.teams, view.control)}
				<h1>${escapeHtml(view.question)}</h1>
				<p class="message">${escapeHtml(view.caption)}</p>
				${view.bank === null ? "" : `<p class="bank">Points on the board: ${view.bank}${view.multiplier > 1 ? ` (times ${view.multiplier})` : ""}</p>`}
				${strikesHtml(view.strikes)}
				${boardHtml(view.answers, previous?.screen === "board" && previous.question === view.question ? previous.answers : null)}
			`;
		case "fast-money":
			return `
				${scoresHtml(view.teams, view.team)}
				<h1>Fast Money</h1>
				<p class="message">${escapeHtml(view.caption)}</p>
				${view.question ? `<p class="timer-box">Seconds left: <span class="timer">${view.seconds}</span></p><p class="fm-question">${escapeHtml(view.question)}</p>` : ""}
				<p class="fm-total">${view.total}</p>
				<div class="fm-columns">
					${fastMoneyColumnHtml("Player 1", view.rows[0])}
					${fastMoneyColumnHtml("Player 2", view.rows[1])}
				</div>
			`;
		case "fast-money-end":
			return `
				<h1>${escapeHtml(view.caption)}</h1>
				<p class="fm-total">${view.total}</p>
				${scoresHtml(view.teams, view.team)}
			`;
		default:
			return `
				<h1 class="logo">Family Feud</h1>
				<p>Waiting for the host to start a game.</p>
			`;
	}
}

export function startSpectator(app, statusEl, code) {
	const audio = createAudio();
	audio.unlock();
	document.body.classList.add("spectator");
	app.innerHTML = `<h1 class="logo">Family Feud</h1><p>Connecting to game ${escapeHtml(code)}...</p>`;
	let lastSeq = -1;
	let firstMessage = true;
	let lastCaption = "";
	let lastView = null;
	let lastViewJson = "";

	const source = new EventSource(`room/${code}/events`);
	source.onmessage = event => {
		const { seq, view, sounds } = JSON.parse(event.data);
		if (seq <= lastSeq) return;
		lastSeq = seq;
		const viewJson = JSON.stringify(view);
		if (viewJson === lastViewJson && sounds.length === 0) return;
		lastViewJson = viewJson;
		document.body.dataset.team = view.activeTeam ?? "";
		app.innerHTML = viewHtml(view, lastView);
		lastView = view;
		const caption = view.caption ?? "";
		if (caption && caption !== lastCaption) announce(statusEl, caption);
		lastCaption = caption;
		if (firstMessage) {
			firstMessage = false;
			return;
		}
		for (const sound of sounds) {
			audio[sound]?.();
			if (sound === "strike") flashStrike(Math.max(view.strikes ?? 1, 1));
		}
	};
}
