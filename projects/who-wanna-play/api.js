export async function request(method, path, body) {
	const options = { method };
	if (body !== undefined) {
		options.headers = { "Content-Type": "application/json" };
		options.body = JSON.stringify(body);
	}
	let response;
	try {
		response = await fetch(`/api${path}`, options);
	} catch {
		throw new Error("Couldn't reach the server. Check your connection.");
	}
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(data.error || "Something went wrong.");
		error.status = response.status;
		throw error;
	}
	return data;
}
