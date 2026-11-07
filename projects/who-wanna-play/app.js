import { askName, getName } from "./name.js";
import { navigate } from "./nav.js";
import { clearAlert } from "./dom.js";
import { renderHome } from "./home.js";
import { renderNewActivity } from "./new-activity.js";
import { renderActivity } from "./activity.js";

const main = document.getElementById("main");
const nameButton = document.getElementById("name-button");
let cleanup = null;
let firstRender = true;

function pageFor(path) {
	if (path === "") return renderHome;
	if (path === "new") return renderNewActivity;
	return renderActivity;
}

function route() {
	cleanup?.();
	clearAlert();
	main.replaceChildren();
	const path = location.pathname.slice(1).replace(/\/+$/, "");
	cleanup = pageFor(path)(main, path) ?? null;
	const target = main.querySelector("[data-autofocus]") ?? (firstRender ? null : main.querySelector("h1"));
	target?.focus();
	firstRender = false;
}

function updateGreeting() {
	const name = getName();
	document.getElementById("greeting-text").textContent = name ? `Hello, ${name}` : "";
	nameButton.textContent = name ? "Change" : "Set your name";
	if (name) nameButton.setAttribute("aria-label", "Change your name");
	else nameButton.removeAttribute("aria-label");
}

function isPlainClick(event) {
	return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

document.addEventListener("click", (event) => {
	const link = event.target.closest("a[href]");
	if (!link || event.defaultPrevented || !isPlainClick(event)) return;
	if (link.origin !== location.origin || link.target || link.getAttribute("href").startsWith("#")) return;
	event.preventDefault();
	navigate(link.pathname);
});

nameButton.addEventListener("click", askName);
document.addEventListener("namechange", updateGreeting);
window.addEventListener("popstate", route);
updateGreeting();
route();
