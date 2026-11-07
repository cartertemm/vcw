const LIVE_REGION_DELAY_MS = 50;

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
