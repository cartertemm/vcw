import { announce, el, shareCard, showAlert } from "./dom.js";
import { request } from "./api.js";
import { getName, requireName } from "./name.js";
import { runDialog } from "./dialogs.js";
import { renderNotFound } from "./home.js";
import {
	PRIVACY_LINE,
	RESULT_COLUMNS,
	bulkAddedText,
	countdownText,
	formatDate,
	nextSort,
	rankLabel,
	rankingProgress,
	resultCaption,
	resultRows,
	rulesText,
	sortMessage,
	sortRows,
} from "./format.js";
import { VOTE_OPTIONS, applyRank, applyVote } from "./votes.js";

const POLL_MS = 3000;
const TICK_MS = 1000;

export function renderActivity(main, path) {
	const [first, ...rest] = path.split("/");
	const apiPath = rest.length
		? `/events/${encodeURIComponent(first)}/activities/${encodeURIComponent(rest.join("/"))}`
		: `/activities/${encodeURIComponent(first)}`;
	const heading = el("h1", { tabIndex: -1 }, "Loading…");
	const description = el("p", { className: "lead" });
	const choiceList = el("ul", { className: "choice-list" });
	const noChoices = el("p", {}, "No choices yet. Add the first one!");
	const countdown = el("p", { className: "countdown" });
	const revealDate = el("p", { className: "help" });
	const noResults = el("p", {}, "Nothing to count yet.");
	const resultBody = el("tbody");
	const bulkNote = el("p", { className: "help", hidden: true });
	const rankingNote = el("p", { className: "help progress", hidden: true });
	const caption = el("caption");
	const cards = new Map();
	const tableRows = new Map();
	const sortHeaders = new Map();
	let resultTable = null;
	let sort = null;
	let activity = null;
	let myVotes = {};
	let pendingVotes = 0;
	let voteVersion = 0;
	let clockOffset = 0;
	let pollTimer = 0;
	let inFlight = null;
	let built = false;
	let stopped = false;
	let bulkDraft = "";
	main.append(heading);

	async function load() {
		const version = voteVersion;
		const data = await request("GET", `${apiPath}?voter=${encodeURIComponent(getName())}`);
		if (stopped) return;
		activity = data;
		clockOffset = Date.parse(data.serverNow) - Date.now();
		if (pendingVotes === 0 && version === voteVersion) myVotes = data.myVotes;
		if (!built) build();
		update();
	}

	function poll() {
		clearTimeout(pollTimer);
		if (stopped || inFlight) return;
		inFlight = (document.hidden ? Promise.resolve() : load())
			.catch(handleLoadError)
			.finally(() => {
				inFlight = null;
				if (!stopped) pollTimer = setTimeout(poll, POLL_MS);
			});
	}

	function handleLoadError(error) {
		if (error.status === 404) {
			stop();
			main.replaceChildren();
			renderNotFound(main);
			main.querySelector("h1").focus();
			return;
		}
		if (!built) {
			heading.textContent = "Couldn't load this activity";
			showAlert(`${error.message} Trying again…`);
		}
	}

	function build() {
		built = true;
		document.title = `${activity.name} | Who Wanna Play?`;
		heading.textContent = activity.name;
		description.textContent = activity.description;
		description.hidden = !activity.description;
		resultTable = buildResultTable();
		if (activity.event) {
			heading.before(el("p", { className: "breadcrumb" }, el("a", { href: `/${activity.event.slug}` }, `Part of ${activity.event.name}`)));
		}
		main.append(
			description,
			el("div", { className: "actions" },
				el("button", { type: "button", onclick: showRules }, "Show rules"),
				el("button", { type: "button", className: "primary", onclick: addChoiceFlow }, "Add choice"),
				el("button", { type: "button", onclick: addManyFlow }, "Add multiple choices"),
			),
			bulkNote,
			el("div", {},
				el("h2", {}, "Choices"),
				rankingNote,
				noChoices,
				choiceList,
			),
			el("div", { className: "card" },
				el("h2", {}, "Results"),
				el("p", { className: "help" }, PRIVACY_LINE),
				countdown,
				revealDate,
				noResults,
				resultTable,
			),
			shareCard(activity.path, "You can share this poll with someone by giving them the link.", "Link to this poll"),
		);
	}

	function isRanking() {
		return activity.type === "ranking";
	}

	function voteButtons(choice, headingId) {
		const buttons = new Map(VOTE_OPTIONS.map(([value, label]) => [value, el("button", {
			type: "button",
			className: `vote vote-${value}`,
			"aria-pressed": "false",
			onclick: () => vote(choice.id, value),
		}, label)]));
		cards.set(choice.id, buttons);
		return el("div", { role: "group", "aria-labelledby": headingId, className: "vote-group" }, ...buttons.values());
	}

	function rankPicker(choice) {
		const id = `rank-${choice.id}`;
		const select = el("select", { id });
		select.addEventListener("change", () => vote(choice.id, select.value ? Number(select.value) : null));
		cards.set(choice.id, select);
		return el("div", { className: "rank-row" },
			el("label", { htmlFor: id }, "Rank", el("span", { className: "visually-hidden" }, ` for ${choice.name}`)),
			select,
		);
	}

	function addCard(choice) {
		const headingId = `choice-${choice.id}`;
		choiceList.append(el("li", { className: "choice" },
			el("h3", { id: headingId }, choice.name),
			choice.description ? el("p", {}, choice.description) : null,
			isRanking() ? rankPicker(choice) : voteButtons(choice, headingId),
		));
	}

	function fillRankOptions(select, total) {
		if (select.options.length === total + 1) return;
		select.replaceChildren(
			el("option", { value: "" }, "Not ranked"),
			...Array.from({ length: total }, (_, index) => el("option", { value: String(index + 1) }, rankLabel(index + 1, total))),
		);
	}

	function renderVotes() {
		const total = activity.choices.length;
		for (const [choiceId, card] of cards) {
			if (card instanceof Map) {
				for (const [value, button] of card) button.setAttribute("aria-pressed", String(myVotes[choiceId] === value));
			} else {
				fillRankOptions(card, total);
				card.value = String(myVotes[choiceId] ?? "");
			}
		}
		rankingNote.hidden = !isRanking() || total === 0;
		rankingNote.textContent = isRanking() ? rankingProgress(Object.keys(myVotes).length, total) : "";
	}

	function swapMessage(previous, choiceId) {
		const holder = activity.choices.find(({ id }) => id !== choiceId && previous[id] !== undefined && previous[id] === myVotes[choiceId]);
		if (!holder) return "";
		const rank = myVotes[holder.id];
		return rank === undefined ? `${holder.name} is no longer ranked.` : `${holder.name} moved to ${rank}.`;
	}

	function buildResultTable() {
		const headerCells = RESULT_COLUMNS[activity.type].map(([key, label]) => {
			const cell = el("th", { scope: "col", className: key === "name" ? "" : "number" },
				el("button", { type: "button", className: "sort-button", onclick: () => sortBy(key) }, label),
			);
			sortHeaders.set(key, cell);
			return cell;
		});
		return el("div", { className: "table-wrap" },
			el("table", { className: "results-table" },
				caption,
				el("thead", {}, el("tr", {}, ...headerCells)),
				resultBody,
			),
		);
	}

	function tableRow(id, name) {
		if (!tableRows.has(id)) {
			const cells = new Map(RESULT_COLUMNS[activity.type].slice(1).map(([key]) => [key, el("td", { className: "number" })]));
			tableRows.set(id, { row: el("tr", {}, el("th", { scope: "row" }, name), ...cells.values()), cells });
		}
		return tableRows.get(id);
	}

	function updateResults() {
		caption.textContent = resultCaption(activity.type, activity.ballots);
		const rows = sortRows(resultRows(activity.choices, activity.results, activity.type), sort);
		const ordered = rows.map((data) => {
			const { row, cells } = tableRow(data.id, data.name);
			for (const [key, cell] of cells) {
				const text = String(data[key] ?? "None");
				if (cell.textContent !== text) cell.textContent = text;
			}
			return row;
		});
		if (ordered.some((row, index) => resultBody.children[index] !== row)) resultBody.append(...ordered);
	}

	function sortBy(key) {
		sort = nextSort(sort, key);
		for (const [columnKey, cell] of sortHeaders) {
			if (columnKey === sort.key) cell.setAttribute("aria-sort", sort.direction);
			else cell.removeAttribute("aria-sort");
		}
		updateResults();
		announce(sortMessage(sort));
	}

	function update() {
		for (const choice of activity.choices) {
			if (!cards.has(choice.id)) addCard(choice);
		}
		noChoices.hidden = activity.choices.length > 0;
		renderVotes();
		const revealed = activity.results !== null;
		countdown.hidden = revealed;
		revealDate.hidden = revealed;
		resultTable.hidden = !revealed || activity.choices.length === 0;
		noResults.hidden = !revealed || activity.choices.length > 0;
		if (revealed) {
			updateResults();
		} else {
			revealDate.textContent = `Results show on ${formatDate(activity.revealAt)}.`;
			tick();
		}
	}

	function tick() {
		if (!activity || activity.results !== null) return;
		const remaining = Date.parse(activity.revealAt) - (Date.now() + clockOffset);
		countdown.textContent = countdownText(remaining);
		if (remaining <= 0) poll();
	}

	async function vote(choiceId, value) {
		const voter = await requireName();
		if (stopped) return;
		if (!voter) return renderVotes();
		const previous = myVotes;
		let next = value;
		if (isRanking()) {
			myVotes = applyRank(myVotes, choiceId, next);
			const total = activity.choices.length;
			const complete = Object.keys(myVotes).length === total ? rankingProgress(total, total) : "";
			const message = [swapMessage(previous, choiceId), complete].filter(Boolean).join(" ");
			if (message) announce(message);
		} else {
			next = myVotes[choiceId] === value ? null : value;
			myVotes = applyVote(myVotes, choiceId, next, activity.multipleYes);
		}
		pendingVotes += 1;
		voteVersion += 1;
		renderVotes();
		try {
			const response = await request("PUT", `${apiPath}/votes`, { voter, choiceId, value: next });
			if (pendingVotes === 1) myVotes = response.myVotes;
			poll();
		} catch (error) {
			myVotes = previous;
			showAlert(`Your vote didn't save. ${error.message}`);
		} finally {
			pendingVotes -= 1;
			if (!stopped) renderVotes();
		}
	}

	function showRules() {
		document.getElementById("rules-list").replaceChildren(...rulesText(activity).map((text) => el("li", {}, text)));
		runDialog(document.getElementById("rules-dialog"));
	}

	async function addChoiceFlow() {
		const voter = await requireName();
		if (!voter) return;
		const data = await runDialog(document.getElementById("choice-dialog"));
		if (!data || stopped) return;
		try {
			const choice = await request("POST", `${apiPath}/choices`, {
				voter,
				name: data.get("name"),
				description: data.get("description"),
			});
			addLocalChoice(choice);
			update();
			announce(`Added ${choice.name}.`);
		} catch (error) {
			showAlert(`The choice wasn't added. ${error.message}`);
		}
	}

	function addLocalChoice(choice) {
		if (!activity.choices.some((existing) => existing.id === choice.id)) activity.choices.push(choice);
	}

	async function addManyFlow() {
		const voter = await requireName();
		if (!voter) return;
		const data = await runDialog(document.getElementById("bulk-dialog"), { names: bulkDraft });
		if (!data || stopped) return;
		const text = data.get("names");
		try {
			const { added, skipped } = await request("POST", `${apiPath}/choices`, { voter, names: text.split(/\r?\n/) });
			bulkDraft = "";
			added.forEach(addLocalChoice);
			update();
			const message = bulkAddedText(added.length, skipped);
			bulkNote.textContent = message;
			bulkNote.hidden = false;
			announce(message);
		} catch (error) {
			bulkDraft = text;
			showAlert(`The choices weren't added. ${error.message} Your text is kept, so fix it and try again.`);
		}
	}

	const onNameChange = () => poll();
	const onVisibilityChange = () => {
		if (!document.hidden) poll();
	};
	document.addEventListener("namechange", onNameChange);
	document.addEventListener("visibilitychange", onVisibilityChange);
	const tickTimer = setInterval(tick, TICK_MS);

	function stop() {
		stopped = true;
		clearTimeout(pollTimer);
		clearInterval(tickTimer);
		document.removeEventListener("namechange", onNameChange);
		document.removeEventListener("visibilitychange", onVisibilityChange);
	}

	poll();
	return stop;
}
