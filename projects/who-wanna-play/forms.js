import { el } from "./dom.js";
import { requireName } from "./name.js";
import { navigate } from "./nav.js";

export function field(id, label, input, help) {
	if (help) input.setAttribute("aria-describedby", `${id}-help`);
	return el("div", {},
		el("label", { htmlFor: id }, label),
		input,
		help ? el("p", { id: `${id}-help`, className: "help" }, help) : null,
	);
}

export function checkbox(id, label, help) {
	return el("div", { className: "check" },
		el("input", { type: "checkbox", id, name: id, checked: true, "aria-describedby": `${id}-help` }),
		el("div", {},
			el("label", { htmlFor: id }, label),
			el("p", { id: `${id}-help`, className: "help" }, help),
		),
	);
}

export function nameFields() {
	return [
		field("name", "Name", el("input", { id: "name", name: "name", required: true, maxLength: 80, pattern: ".*\\S.*", autofocus: true })),
		field("description", "Description (optional)", el("textarea", { id: "description", name: "description", maxLength: 500, rows: 3 })),
	];
}

function slugField(linkPrefix) {
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
			? `Your link will be ${location.origin}/${linkPrefix}${slug}`
			: "Leave blank to make one from the name. Letters, numbers, and single hyphens only.";
	};
	input.addEventListener("input", updateHelp);
	updateHelp();
	return el("div", {}, el("label", { htmlFor: "slug" }, "Slug (optional)"), input, help);
}

export function advancedSection(linkPrefix, ...fields) {
	const details = el("details", {}, el("summary", {}, "Advanced"), ...fields, slugField(linkPrefix));
	details.addEventListener("invalid", () => {
		details.open = true;
	}, true);
	return details;
}

export async function openFormDialog({ title, intro, fields, submitLabel, save }) {
	const voter = await requireName();
	if (!voter) return;
	const opener = document.activeElement;
	const error = el("p", { className: "alert", role: "alert" });
	const submit = el("button", { type: "submit", className: "primary" }, submitLabel);
	const form = el("form", {},
		el("div", { className: "dialog-header" },
			el("h2", { id: "form-dialog-title" }, title),
			el("button", { type: "button", "data-close": "", className: "close-button", "aria-label": "Close" }, "×"),
		),
		el("p", {}, intro),
		...fields,
		error,
		el("div", { className: "dialog-actions" },
			el("button", { type: "button", "data-close": "" }, "Cancel"),
			submit,
		),
	);
	const dialog = el("dialog", { "aria-labelledby": "form-dialog-title" }, form);
	let saved = false;
	dialog.addEventListener("close", () => {
		dialog.remove();
		if (!saved) opener?.focus();
	});
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		error.textContent = "";
		submit.disabled = true;
		try {
			const path = await save(new FormData(form), voter);
			saved = true;
			dialog.close();
			navigate(`/${path}`);
		} catch (failure) {
			error.textContent = failure.message;
		} finally {
			submit.disabled = false;
		}
	});
	document.body.append(dialog);
	dialog.showModal();
}
