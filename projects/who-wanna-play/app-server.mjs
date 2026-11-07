import http from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	StoreError,
	addChoice,
	addChoices,
	createActivity,
	createEvent,
	emptyState,
	eventView,
	getActivity,
	getEvent,
	listActivities,
	listEvents,
	publicView,
	setVote,
} from "./store.mjs";
import { openVault } from "./vault.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const MAX_BODY_BYTES = 10 * 1024;
const CONTENT_TYPES = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
};
const BROWSER_FILES = [
	"index.html",
	"style.css",
	"app.js",
	"nav.js",
	"dom.js",
	"api.js",
	"dialogs.js",
	"name.js",
	"home.js",
	"new-activity.js",
	"forms.js",
	"format.js",
	"votes.js",
	"activity.js",
];
const STATIC_FILES = new Map(BROWSER_FILES.map((file) => [`/${file}`, { file, type: CONTENT_TYPES[file.slice(file.lastIndexOf("."))] }]));
const APP_PAGE = STATIC_FILES.get("/index.html");
const SECURITY_HEADERS = {
	"Content-Security-Policy": "default-src 'self'",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "no-referrer",
};

function sendJson(res, status, body) {
	res.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
	res.end(JSON.stringify(body));
}

async function readJson(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		size += chunk.length;
		if (size <= MAX_BODY_BYTES) chunks.push(chunk);
	}
	if (size > MAX_BODY_BYTES) throw new StoreError(413, "Request is too large.");
	let body;
	try {
		body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
	} catch {
		throw new StoreError(400, "Request is not valid JSON.");
	}
	if (body === null || typeof body !== "object" || Array.isArray(body)) throw new StoreError(400, "Request must be a JSON object.");
	return body;
}

export async function createAppServer({ dataDir = process.env.WWP_DATA_DIR || join(ROOT, "data") } = {}) {
	const vault = await openVault(dataDir);
	const state = vault.state ?? emptyState();
	state.events ??= {};

	async function createActivityIn(req, res, eventSlug) {
		const activity = createActivity(state, await readJson(req), new Date(), eventSlug);
		await vault.save(state);
		return sendJson(res, 201, { slug: activity.slug, path: activity.path });
	}

	async function handleActivity(req, res, url, path, action) {
		if (!action && req.method === "GET") {
			const activity = getActivity(state, path);
			const event = activity.event ? { slug: activity.event, name: getEvent(state, activity.event).name } : null;
			const voter = url.searchParams.get("voter") ?? "";
			return sendJson(res, 200, publicView(activity, vault.voterSecret, voter, new Date(), event));
		}
		if (action === "choices" && req.method === "POST") {
			const body = await readJson(req);
			const result = "names" in body ? addChoices(state, path, body) : addChoice(state, path, body);
			await vault.save(state);
			return sendJson(res, 201, result);
		}
		if (action === "votes" && req.method === "PUT") {
			const myVotes = setVote(state, vault.voterSecret, path, await readJson(req));
			await vault.save(state);
			return sendJson(res, 200, { myVotes });
		}
		throw new StoreError(404, "Not found.");
	}

	async function handleEvents(req, res, url, [eventSlug, section, slug, action, extra]) {
		if (extra !== undefined) throw new StoreError(404, "Not found.");
		if (!eventSlug && req.method === "GET") return sendJson(res, 200, listEvents(state));
		if (!eventSlug && req.method === "POST") {
			const event = createEvent(state, await readJson(req));
			await vault.save(state);
			return sendJson(res, 201, { slug: event.slug });
		}
		if (eventSlug && !section && req.method === "GET") return sendJson(res, 200, eventView(state, eventSlug));
		if (eventSlug && section === "activities" && !slug && req.method === "POST") return createActivityIn(req, res, eventSlug);
		if (eventSlug && section === "activities" && slug) {
			getEvent(state, eventSlug);
			return handleActivity(req, res, url, `${eventSlug}/${slug}`, action);
		}
		throw new StoreError(404, "Not found.");
	}

	async function handleApi(req, res, url) {
		const [resource, ...rest] = url.pathname.split("/").slice(2);
		if (resource === "events") return handleEvents(req, res, url, rest);
		const [slug, action, extra] = rest;
		if (resource !== "activities" || extra !== undefined) throw new StoreError(404, "Not found.");
		if (!slug && req.method === "GET") return sendJson(res, 200, listActivities(state));
		if (!slug && req.method === "POST") return createActivityIn(req, res, null);
		if (slug) return handleActivity(req, res, url, slug, action);
		throw new StoreError(404, "Not found.");
	}

	async function handleStatic(req, res, url) {
		if (req.method !== "GET" && req.method !== "HEAD") throw new StoreError(405, "Method not allowed.");
		const { file, type } = STATIC_FILES.get(url.pathname) ?? APP_PAGE;
		const body = await readFile(join(ROOT, file));
		res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": type, "Cache-Control": "no-cache" });
		res.end(req.method === "HEAD" ? undefined : body);
	}

	return http.createServer(async (req, res) => {
		try {
			const url = new URL(req.url, "http://localhost");
			if (url.pathname.startsWith("/api/") || url.pathname === "/api") await handleApi(req, res, url);
			else await handleStatic(req, res, url);
		} catch (error) {
			if (error instanceof StoreError) return sendJson(res, error.status, { error: error.message });
			console.error(error.stack);
			sendJson(res, 500, { error: "Something went wrong." });
		}
	});
}
