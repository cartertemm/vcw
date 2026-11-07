import { el } from "./dom.js";
import { request } from "./api.js";
import { requireName } from "./name.js";
import { navigate } from "./nav.js";

function field(id, label, input, help) {
	if (help) input.setAttribute("aria-describedby", `${id}-help`);
	return el("div", {},
		el("label", { htmlFor: id }, label),
		input,
		help ? el("p", { id: `${id}-help`, className: "help" }, help) : null,
	);
}

function checkbox(id, label, help) {
	return el("div", { className: "check" },
		el("input", { type: "checkbox", id, name: id, checked: true, "aria-describedby": `${id}-help` }),
		el("div", {},
			el("label", { htmlFor: id }, label),
			el("p", { id: `${id}-help`, className: "help" }, help),
		),
	);
}

function slugField() {
	const help = el("p", { id: "slug-help", className: "help" });
	const input = el("input", {
		id: "slug",
		name: "slug",
		maxLength: 40,
		pattern: "[A-Za-z0-9]+(-[A-Za-z0-9]+)*",
		autocapitalize: "none",
		spellcheck: false,
		"aria-describedby": "slug-help",
	});
	const updateHelp = () => {
		const slug = input.value.trim().toLowerCase();
		help.textContent = slug
			? `Your link will be ${location.origin}/${slug}`
			: "Leave blank to make one from the name. Letters, numbers, and single hyphens only.";
	};
	input.addEventListener("input", updateHelp);
	updateHelp();
	return el("div", {}, el("label", { htmlFor: "slug" }, "Slug (optional)"), input, help);
}

function readForm(form, voter) {
	const data = new FormData(form);
	const revealAt = data.get("revealAt");
	return {
		voter,
		type: data.get("type"),
		name: data.get("name"),
		description: data.get("description"),
		listed: data.has("listed"),
		multipleYes: data.has("multipleYes"),
		revealAt: revealAt ? new Date(revealAt).toISOString() : null,
		slug: data.get("slug"),
	};
}

function typeOption(value, label, help, checked) {
	return el("div", { className: "check" },
		el("input", { type: "radio", id: `type-${value}`, name: "type", value, checked, "aria-describedby": `type-${value}-help` }),
		el("div", {},
			el("label", { htmlFor: `type-${value}` }, label),
			el("p", { id: `type-${value}-help`, className: "help" }, help),
		),
	);
}

function typeField() {
	return el("fieldset", { className: "poll-type" },
		el("legend", {}, "Poll type"),
		typeOption("yesno", "Yes / No", "Each person says Yes, No, or No preference to each choice.", true),
		typeOption("ranking", "Ranking", "Each person puts every choice in order, from favorite to least favorite.", false),
	);
}

export async function openCreateDialog() {
	const voter = await requireName();
	if (!voter) return;
	const opener = document.activeElement;
	const multipleYes = checkbox("multipleYes", "Allow multiple submissions from the same person?", "If unchecked, each person can vote Yes on only one choice.");
	const types = typeField();
	types.addEventListener("change", () => {
		multipleYes.hidden = types.querySelector("#type-ranking").checked;
	});
	const advanced = el("details", {},
		el("summary", {}, "Advanced"),
		multipleYes,
		field("revealAt", "Show results at", el("input", { id: "revealAt", name: "revealAt", type: "datetime-local" }), "Leave blank to always show results. Otherwise everyone sees a countdown until then."),
		slugField(),
	);
	advanced.addEventListener("invalid", () => {
		advanced.open = true;
	}, true);
	const error = el("p", { className: "alert", role: "alert" });
	const submit = el("button", { type: "submit", className: "primary" }, "Create activity");
	const form = el("form", {},
		el("div", { className: "dialog-header" },
			el("h2", { id: "create-dialog-title" }, "Add activity"),
			el("button", { type: "button", "data-close": "", className: "close-button", "aria-label": "Close" }, "×"),
		),
		el("p", {}, "Set it up, then share the link with your friends."),
		field("name", "Name", el("input", { id: "name", name: "name", required: true, maxLength: 80, pattern: ".*\\S.*", autofocus: true })),
		field("description", "Description (optional)", el("textarea", { id: "description", name: "description", maxLength: 500, rows: 3 })),
		types,
		checkbox("listed", "Show on the main page?", "If unchecked, people can only open it with the link."),
		advanced,
		error,
		el("div", { className: "dialog-actions" },
			el("button", { type: "button", "data-close": "" }, "Cancel"),
			submit,
		),
	);
	const dialog = el("dialog", { "aria-labelledby": "create-dialog-title" }, form);
	let created = false;
	dialog.addEventListener("close", () => {
		dialog.remove();
		if (!created) opener?.focus();
	});
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		error.textContent = "";
		submit.disabled = true;
		try {
			const { slug } = await request("POST", "/activities", readForm(form, voter));
			created = true;
			dialog.close();
			navigate(`/${slug}`);
		} catch (failure) {
			error.textContent = failure.message;
		} finally {
			submit.disabled = false;
		}
	});
	document.body.append(dialog);
	dialog.showModal();
}
