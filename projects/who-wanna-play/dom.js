const LIVE_REGION_DELAY_MS = 50;
const COPIED_MS = 2000;

export function el(tag, props = {}, ...children) {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(props)) {
		if (key in node) node[key] = value;
		else node.setAttribute(key, value);
	}
	node.append(...children.filter((child) => child !== null && child !== undefined));
	return node;
}

function speak(id, message) {
	const region = document.getElementById(id);
	region.textContent = "";
	setTimeout(() => {
		region.textContent = message;
	}, LIVE_REGION_DELAY_MS);
}

export function showAlert(message) {
	speak("alert", message);
}

export function announce(message) {
	speak("status", message);
}

export function clearAlert() {
	document.getElementById("alert").textContent = "";
}

async function copyLink(input, button) {
	try {
		await navigator.clipboard.writeText(input.value);
		button.textContent = "Copied!";
		setTimeout(() => {
			button.textContent = "Copy link";
		}, COPIED_MS);
		announce("Link copied");
	} catch {
		input.select();
		announce("Couldn't copy. The link is selected, so press Ctrl+C or Command+C.");
	}
}

export function shareCard(path, intro, label) {
	const input = el("input", { id: "share-link", readOnly: true, value: `${location.origin}/${path}` });
	const button = el("button", { type: "button", onclick: () => copyLink(input, button) }, "Copy link");
	return el("div", { className: "card" },
		el("h2", {}, "Share"),
		el("p", {}, intro),
		el("label", { htmlFor: "share-link" }, label),
		el("div", { className: "share-row" }, input, button),
	);
}
