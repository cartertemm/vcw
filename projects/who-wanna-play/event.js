import { el, shareCard, showAlert } from "./dom.js";
import { request } from "./api.js";
import { linkItems } from "./home.js";
import { openCreateDialog } from "./new-activity.js";
import { renderActivity } from "./activity.js";

export function renderEvent(main, slug) {
	const heading = el("h1", { tabIndex: -1 }, "Loading…");
	const description = el("p", { className: "lead" });
	const status = el("p", {}, "No activities yet. Add the first one!");
	const list = el("ul", { className: "activity-list" });
	let built = false;
	let stopped = false;
	let cleanup = null;
	main.append(heading);

	function build(event) {
		built = true;
		document.title = `${event.name} | Who Wanna Play?`;
		heading.textContent = event.name;
		description.textContent = event.description;
		description.hidden = !event.description;
		main.append(
			description,
			el("div", { className: "actions" },
				el("button", { type: "button", className: "primary", onclick: () => openCreateDialog({ event: slug }) }, "Add activity"),
			),
			el("div", {},
				el("h2", {}, "Activities"),
				el("p", { className: "help" }, "Each activity is one poll for this event. Pick one to vote, or add your own."),
				status,
				list,
			),
			shareCard(slug, "You can share this event with someone by giving them the link.", "Link to this event"),
		);
	}

	function showActivities(activities) {
		status.hidden = activities.length > 0;
		list.hidden = activities.length === 0;
		list.replaceChildren(...linkItems(activities));
	}

	function showActivityPage() {
		const hadFocus = document.activeElement === heading;
		main.replaceChildren();
		cleanup = renderActivity(main, slug);
		if (hadFocus) main.querySelector("h1")?.focus();
	}

	async function load() {
		try {
			const event = await request("GET", `/events/${encodeURIComponent(slug)}`);
			if (stopped) return;
			if (!built) build(event);
			showActivities(event.activities);
		} catch (error) {
			if (stopped || built) return;
			if (error.status === 404) return showActivityPage();
			heading.textContent = "Couldn't load this event";
			showAlert(error.message);
		}
	}

	const onVisibilityChange = () => {
		if (!document.hidden && built) load();
	};
	document.addEventListener("visibilitychange", onVisibilityChange);
	load();
	return () => {
		stopped = true;
		document.removeEventListener("visibilitychange", onVisibilityChange);
		cleanup?.();
	};
}
