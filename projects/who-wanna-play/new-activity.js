import { el } from "./dom.js";
import { request } from "./api.js";
import { advancedSection, checkbox, field, nameFields, openFormDialog } from "./forms.js";

function readForm(data, voter) {
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

export function openCreateDialog() {
	const multipleYes = checkbox("multipleYes", "Allow multiple submissions from the same person?", "If unchecked, each person can vote Yes on only one choice.");
	const types = typeField();
	types.addEventListener("change", () => {
		multipleYes.hidden = types.querySelector("#type-ranking").checked;
	});
	return openFormDialog({
		title: "Add activity",
		intro: "Set it up, then share the link with your friends.",
		submitLabel: "Create activity",
		fields: [
			...nameFields(),
			types,
			checkbox("listed", "Show on the main page?", "If unchecked, people can only open it with the link."),
			advancedSection("",
				multipleYes,
				field("revealAt", "Show results at", el("input", { id: "revealAt", name: "revealAt", type: "datetime-local" }), "Leave blank to always show results. Otherwise everyone sees a countdown until then."),
			),
		],
		save: async (data, voter) => (await request("POST", "/activities", readForm(data, voter))).path,
	});
}
