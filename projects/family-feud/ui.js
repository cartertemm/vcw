import { escapeHtml } from "./dom-utils.js";

const STRIKE_FLASH_MS = 900;

export function scoresHtml(teams, controlIndex = null) {
	return `
		<section class="scores" aria-label="Scores">
			${teams.map((team, i) => `
				<div class="team team-${i}${i === controlIndex ? " in-control" : ""}">
					<span class="team-name">${escapeHtml(team.name)}</span>
					<span class="team-score">${team.score}</span>
				</div>
			`).join("")}
		</section>
	`;
}

export function strikesHtml(count) {
	return `<div class="strikes" aria-hidden="true">${"<span>X</span>".repeat(count)}</div>`;
}

export function flashStrike(count) {
	document.querySelector(".strike-flash")?.remove();
	const overlay = document.createElement("div");
	overlay.className = "strike-flash";
	overlay.setAttribute("aria-hidden", "true");
	overlay.innerHTML = "<span>X</span>".repeat(count);
	document.body.appendChild(overlay);
	setTimeout(() => overlay.remove(), STRIKE_FLASH_MS);
}
