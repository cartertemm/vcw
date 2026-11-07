import { el } from "./dom.js";
import { request } from "./api.js";
import { openCreateDialog } from "./new-activity.js";
import { openEventDialog } from "./new-event.js";

const INTRO = [
	"This was meant for those situations where a bunch of people are hanging out and no one knows exactly what they want to do and everyone has a bunch of ideas and so then you spend way too much time trying to keep track of what the majority of people want to do until someone's like \"I'm going to outback...\" despite the fact that no one likes or cares about outback and some people are vegetarians and other people had steak that night and so now really noone is happy but you do it anyway?",
	"Don't have friends like that? I guess you're somewhat normal.",
];
const PRIVACY_POINTS = [
	"Results show totals only. The app never shows anyone, including us, who picked what.",
	"Your name is never saved on our server. It is turned into a scrambled code that can't be turned back into your name.",
	"Everything is encrypted on its way to us and while it is stored.",
	"Your name stays in a cookie in your browser, so you don't have to type it again.",
	"With only a few voters, friends might be able to guess. Vote boldly anyway.",
];
const SOURCE_URL = "https://github.com/cartertemm/vcw/tree/main/projects/who-wanna-play";

export function linkItems(items) {
	return items.map((item) => el("li", {},
		el("a", { href: `/${item.path ?? item.slug}` }, item.name),
		item.description ? el("p", {}, item.description) : null,
	));
}

function listCard({ heading, explanation, addLabel, onAdd, apiPath, emptyText }) {
	const status = el("p", {}, "Loading…");
	const list = el("ul", { className: "activity-list" });
	request("GET", apiPath)
		.then((items) => {
			status.textContent = emptyText;
			status.hidden = items.length > 0;
			list.hidden = items.length === 0;
			list.append(...linkItems(items));
		})
		.catch((error) => {
			status.textContent = error.message;
		});
	return el("div", { className: "card" },
		el("h2", {}, heading),
		el("p", { className: "help" }, explanation),
		el("button", { type: "button", className: "primary", onclick: onAdd }, addLabel),
		status,
		list,
	);
}

export function renderHome(main) {
	document.title = "Who Wanna Play?";
	main.append(
		el("h1", { tabIndex: -1 }, "Who Wanna Play?"),
		el("div", { className: "intro" }, ...INTRO.map((text) => el("p", {}, text))),
		listCard({
			heading: "Events",
			explanation: "An event is a get-together, like a Halloween party. It keeps all the polls for that day in one place, with one link to share.",
			addLabel: "Add event",
			onAdd: openEventDialog,
			apiPath: "/events",
			emptyText: "No public events yet. Add one!",
		}),
		listCard({
			heading: "Activities",
			explanation: "An activity is a single poll, like where to eat. The ones here are on their own, not part of an event.",
			addLabel: "Add activity",
			onAdd: () => openCreateDialog(),
			apiPath: "/activities",
			emptyText: "No public activities yet. Add one!",
		}),
		el("div", { className: "card" },
			el("h2", {}, "Your privacy"),
			el("p", {}, "This is all in good fun, but your data still deserves respect."),
			el("ul", {}, ...PRIVACY_POINTS.map((text) => el("li", {}, text))),
			el("p", {}, "Don't want to trust us? You don't have to. ", el("a", { href: SOURCE_URL }, "Run your own copy"), "."),
		),
	);
}

export function renderNotFound(main) {
	document.title = "Not found | Who Wanna Play?";
	main.append(
		el("h1", { tabIndex: -1 }, "Not found"),
		el("p", {}, "There's nothing at this link. Check the link, or start something new."),
		el("a", { href: "/", className: "button" }, "Go home"),
	);
}
