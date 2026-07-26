import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = 8124;
const TYPES = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
};
const root = process.cwd();

http.createServer(async (req, res) => {
	const requestedPath = req.url.split('?')[0];
	const path = requestedPath === '/' ? '/index.html' : requestedPath;
	try {
		const file = await readFile(join(root, normalize(decodeURIComponent(path))));
		res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
		res.end(file);
	} catch {
		res.writeHead(404);
		res.end('not found');
	}
}).listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
