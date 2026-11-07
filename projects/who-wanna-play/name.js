import { runDialog } from "./dialogs.js";

const COOKIE_NAME = "wwp_name";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function getName() {
	const prefix = `${COOKIE_NAME}=`;
	const entry = document.cookie.split("; ").find((part) => part.startsWith(prefix));
	if (!entry) return "";
	try {
		return decodeURIComponent(entry.slice(prefix.length));
	} catch {
		return "";
	}
}

function saveName(name) {
	const secure = location.protocol === "https:" ? "; Secure" : "";
	document.cookie = `${COOKIE_NAME}=${encodeURIComponent(name)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

export async function askName() {
	const data = await runDialog(document.getElementById("name-dialog"), { name: getName() });
	const name = data?.get("name").trim() ?? "";
	if (!name) return "";
	saveName(name);
	document.dispatchEvent(new Event("namechange"));
	return name;
}

export async function requireName() {
	return getName() || askName();
}
