export function runDialog(dialog, values = {}) {
	const form = dialog.querySelector("form");
	const opener = document.activeElement;
	form.reset();
	for (const [name, value] of Object.entries(values)) form.elements[name].value = value;
	dialog.returnValue = "";
	dialog.showModal();
	return new Promise((resolve) => {
		dialog.addEventListener("close", () => {
			const data = dialog.returnValue === "save" ? new FormData(form) : null;
			form.reset();
			opener?.focus();
			resolve(data);
		}, { once: true });
	});
}

document.addEventListener("click", (event) => {
	const button = event.target.closest("[data-close]");
	if (button) button.closest("dialog").close("cancel");
});

const FOCUSABLE = "button, [href], input, select, textarea, summary, [tabindex]";

function tabStops(dialog) {
	return [...dialog.querySelectorAll(FOCUSABLE)].filter((node) => node.tabIndex >= 0 && !node.disabled && node.checkVisibility());
}

document.addEventListener("keydown", (event) => {
	if (event.key !== "Tab") return;
	const dialog = [...document.querySelectorAll("dialog[open]")].pop();
	if (!dialog) return;
	const stops = tabStops(dialog);
	const active = document.activeElement;
	const first = stops[0];
	const last = stops.at(-1);
	if (event.shiftKey && (active === first || !stops.includes(active))) {
		event.preventDefault();
		last?.focus();
	} else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
		event.preventDefault();
		first?.focus();
	}
});
