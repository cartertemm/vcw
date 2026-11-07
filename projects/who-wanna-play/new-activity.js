import { clearAlert, el, showAlert } from "./dom.js";
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
		name: data.get("name"),
		description: data.get("description"),
		listed: data.has("listed"),
		multipleYes: data.has("multipleYes"),
		revealAt: revealAt ? new Date(revealAt).toISOString() : null,
		slug: data.get("slug"),
	};
}

export function renderNewActivity(main) {
	document.title = "Add activity | Who Wanna Play?";
	const advanced = el("details", {},
		el("summary", {}, "Advanced"),
		checkbox("multipleYes", "Allow multiple submissions from the same person?", "If unchecked, each person can vote Yes on only one choice."),
		field("revealAt", "Show results at", el("input", { id: "revealAt", name: "revealAt", type: "datetime-local" }), "Leave blank to always show results. Otherwise everyone sees a countdown until then."),
		slugField(),
	);
	advanced.addEventListener("invalid", () => {
		advanced.open = true;
	}, true);
	const submit = el("button", { type: "submit", className: "primary" }, "Create activity");
	const form = el("form", { className: "card" },
		field("name", "Name", el("input", { id: "name", name: "name", required: true, maxLength: 80, pattern: ".*\\S.*" })),
		field("description", "Description (optional)", el("textarea", { id: "description", name: "description", maxLength: 500, rows: 3 })),
		checkbox("listed", "Show on the main page?", "If unchecked, people can only open it with the link."),
		advanced,
		el("div", { className: "form-actions" }, submit),
	);
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		clearAlert();
		const voter = await requireName();
		if (!voter) return;
		submit.disabled = true;
		try {
			const { slug } = await request("POST", "/activities", readForm(form, voter));
			navigate(`/${slug}`);
		} catch (error) {
			showAlert(error.message);
		} finally {
			submit.disabled = false;
		}
	});
	main.append(
		el("h1", { tabIndex: -1 }, "Add activity"),
		el("p", { className: "lead" }, "Set it up, then share the link with your friends."),
		form,
	);
}
