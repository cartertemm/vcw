export function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

export function focusElement(element) {
	if (!element.hasAttribute("tabindex")) {
		element.setAttribute("tabindex", "-1");
	}
	element.focus();
}

let clearAnnounceTimer = null;

export function announce(statusEl, text) {
	clearTimeout(clearAnnounceTimer);
	statusEl.textContent = text;
	clearAnnounceTimer = setTimeout(() => {
		statusEl.textContent = "";
	}, 300);
}
