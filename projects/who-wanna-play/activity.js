import { announce, el, showAlert } from "./dom.js";
import { request } from "./api.js";
import { getName, requireName } from "./name.js";
import { runDialog } from "./dialogs.js";
import { renderNotFound } from "./home.js";
import { PRIVACY_LINE, bulkAddedText, countdownText, formatDate, rulesText, tallyText } from "./format.js";
import { VOTE_OPTIONS, applyVote } from "./votes.js";

const POLL_MS = 3000;
const TICK_MS = 1000;
const COPIED_MS = 2000;

export function renderActivity(main, slug) {
	const apiPath = `/activities/${encodeURIComponent(slug)}`;
	const heading = el("h1", { tabIndex: -1 }, "Loading…");
	const description = el("p", { className: "lead" });
	const choiceList = el("ul", { className: "choice-list" });
	const noChoices = el("p", {}, "No choices yet. Add the first one!");
	const countdown = el("p", { className: "countdown" });
	const revealDate = el("p", { className: "help" });
	const noResults = el("p", {}, "Nothing to count yet.");
	const resultList = el("div", { className: "results" });
	const bulkNote = el("p", { className: "help", hidden: true });
	const cards = new Map();
	const resultRows = new Map();
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
		const shareInput = el("input", { id: "share-link", readOnly: true, value: `${location.origin}/${activity.slug}` });
		const copyButton = el("button", { type: "button", onclick: () => copyLink(shareInput, copyButton) }, "Copy link");
		main.append(
			description,
			el("div", { className: "actions" },
				el("button", { type: "button", onclick: showRules }, "Show rules"),
				el("button", { type: "button", className: "primary", onclick: addChoiceFlow }, "Add choice"),
				el("button", { type: "button", onclick: addManyFlow }, "Add multiple choices"),
			),
			bulkNote,
			el("section", { "aria-labelledby": "choices-heading" },
				el("h2", { id: "choices-heading" }, "Choices"),
				noChoices,
				choiceList,
			),
			el("section", { className: "card", "aria-labelledby": "results-heading" },
				el("h2", { id: "results-heading" }, "Results"),
				el("p", { className: "help" }, PRIVACY_LINE),
				countdown,
				revealDate,
				noResults,
				resultList,
			),
			el("section", { className: "card", "aria-labelledby": "share-heading" },
				el("h2", { id: "share-heading" }, "Share"),
				el("p", {}, "You can share this poll with someone by giving them the link."),
				el("label", { htmlFor: "share-link" }, "Link to this poll"),
				el("div", { className: "share-row" }, shareInput, copyButton),
			),
		);
	}

	function addCard(choice) {
		const headingId = `choice-${choice.id}`;
		const buttons = new Map(VOTE_OPTIONS.map(([value, label]) => [value, el("button", {
			type: "button",
			className: `vote vote-${value}`,
			"aria-pressed": "false",
			onclick: () => vote(choice.id, value),
		}, label)]));
		choiceList.append(el("li", { className: "choice" },
			el("h3", { id: headingId }, choice.name),
			choice.description ? el("p", {}, choice.description) : null,
			el("div", { role: "group", "aria-labelledby": headingId, className: "vote-group" }, ...buttons.values()),
		));
		cards.set(choice.id, buttons);
	}

	function renderPressed() {
		for (const [choiceId, buttons] of cards) {
			for (const [value, button] of buttons) button.setAttribute("aria-pressed", String(myVotes[choiceId] === value));
		}
	}

	function updateResults() {
		for (const choice of activity.choices) {
			if (!resultRows.has(choice.id)) {
				const row = el("p", { className: "tally" });
				resultList.append(el("h3", {}, choice.name), row);
				resultRows.set(choice.id, row);
			}
			resultRows.get(choice.id).textContent = tallyText(activity.results[choice.id]);
		}
	}

	function update() {
		for (const choice of activity.choices) {
			if (!cards.has(choice.id)) addCard(choice);
		}
		noChoices.hidden = activity.choices.length > 0;
		renderPressed();
		const revealed = activity.results !== null;
		countdown.hidden = revealed;
		revealDate.hidden = revealed;
		resultList.hidden = !revealed;
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
		if (!voter || stopped) return;
		const next = myVotes[choiceId] === value ? null : value;
		const previous = myVotes;
		myVotes = applyVote(myVotes, choiceId, next, activity.multipleYes);
		pendingVotes += 1;
		voteVersion += 1;
		renderPressed();
		try {
			const response = await request("PUT", `${apiPath}/votes`, { voter, choiceId, value: next });
			if (pendingVotes === 1) myVotes = response.myVotes;
			poll();
		} catch (error) {
			myVotes = previous;
			showAlert(`Your vote didn't save. ${error.message}`);
		} finally {
			pendingVotes -= 1;
			if (!stopped) renderPressed();
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

	async function copyLink(input, button) {
		try {
			await navigator.clipboard.writeText(input.value);
			button.textContent = "Copied!";
			setTimeout(() => {
				button.textContent = "Copy link";
			}, COPIED_MS);
			announce("Link copied");
		} catch {
			input.select();
			announce("Couldn't copy. The link is selected, so press Ctrl+C or Command+C.");
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
