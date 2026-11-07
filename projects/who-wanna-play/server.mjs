import { spawn } from "node:child_process";
import { createAppServer } from "./app-server.mjs";

const HOST = "127.0.0.1";
const PORT = 8125;

const server = await createAppServer();
server.listen(PORT, HOST, () => {
	console.log(`Serving on http://localhost:${PORT}`);
	const tailscale = spawn("tailscale", ["funnel", String(PORT)], { stdio: "inherit" });
	tailscale.on("error", () => console.log("tailscale not found, serving locally only"));
	process.on("SIGINT", () => {
		tailscale.kill();
		process.exit();
	});
});
