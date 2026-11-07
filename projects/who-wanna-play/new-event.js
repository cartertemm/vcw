import { request } from "./api.js";
import { advancedSection, checkbox, nameFields, openFormDialog } from "./forms.js";

export function openEventDialog() {
	return openFormDialog({
		title: "Add event",
		intro: "Make a page for your get-together, then add the polls for it.",
		submitLabel: "Create event",
		fields: [
			...nameFields(),
			checkbox("listed", "Show on the main page?", "If unchecked, people can only open it with the link."),
			advancedSection(""),
		],
		save: async (data, voter) => {
			const body = { voter, name: data.get("name"), description: data.get("description"), listed: data.has("listed"), slug: data.get("slug") };
			return (await request("POST", "/events", body)).slug;
		},
	});
}
