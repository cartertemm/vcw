import { el } from "./dom.js";
import { request } from "./api.js";
import { openCreateDialog } from "./new-activity.js";

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

export function renderHome(main) {
	document.title = "Who Wanna Play?";
	const status = el("p", {}, "Loading activities…");
	const list = el("ul", { className: "activity-list" });
	main.append(
		el("h1", { tabIndex: -1 }, "Who Wanna Play?"),
		el("div", { className: "intro" }, ...INTRO.map((text) => el("p", {}, text))),
		el("div", { className: "card" },
			el("h2", {}, "Activities"),
			el("button", { type: "button", className: "primary", onclick: openCreateDialog }, "Add activity"),
			status,
			list,
		),
		el("div", { className: "card" },
			el("h2", {}, "Your privacy"),
			el("p", {}, "This is all in good fun, but your data still deserves respect."),
			el("ul", {}, ...PRIVACY_POINTS.map((text) => el("li", {}, text))),
			el("p", {}, "Don't want to trust us? You don't have to. ", el("a", { href: SOURCE_URL }, "Run your own copy"), "."),
		),
	);
	request("GET", "/activities")
		.then((activities) => {
			status.textContent = "No public activities yet. Add one!";
			status.hidden = activities.length > 0;
			list.append(...activities.map((activity) => el("li", {},
				el("a", { href: `/${activity.slug}` }, activity.name),
				activity.description ? el("p", {}, activity.description) : null,
			)));
		})
		.catch((error) => {
			status.textContent = error.message;
		});
}

export function renderNotFound(main) {
	document.title = "Not found | Who Wanna Play?";
	main.append(
		el("h1", { tabIndex: -1 }, "Not found"),
		el("p", {}, "There's no activity at this link. Check the link, or start a new one."),
		el("a", { href: "/", className: "button" }, "Go home"),
	);
}
