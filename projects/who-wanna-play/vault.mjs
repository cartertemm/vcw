import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const VOTER_SECRET_LABEL = "who-wanna-play voter codes";

export function encrypt(key, text) {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

export function decrypt(key, data) {
	const decipher = createDecipheriv(ALGORITHM, key, data.subarray(0, IV_BYTES));
	decipher.setAuthTag(data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
	return Buffer.concat([decipher.update(data.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8");
}

async function readIfExists(path) {
	try {
		return await readFile(path);
	} catch (error) {
		if (error.code === "ENOENT") return null;
		throw error;
	}
}

export async function openVault(dir) {
	await mkdir(dir, { recursive: true });
	const keyPath = join(dir, "secret.key");
	const dataPath = join(dir, "data.enc");
	const tempPath = join(dir, "data.enc.tmp");
	let key = await readIfExists(keyPath);
	const data = await readIfExists(dataPath);
	if (!key) {
		if (data) throw new Error(`${keyPath} is missing but ${dataPath} exists. Restore the key or move the data file away.`);
		key = randomBytes(KEY_BYTES);
		await writeFile(keyPath, key, { mode: 0o600, flag: "wx" });
	}
	if (key.length !== KEY_BYTES) throw new Error(`${keyPath} must be exactly ${KEY_BYTES} bytes.`);
	let state = null;
	if (data) {
		try {
			state = JSON.parse(decrypt(key, data));
		} catch {
			throw new Error(`Could not decrypt ${dataPath}. The key in ${keyPath} does not match it.`);
		}
	}
	let queue = Promise.resolve();
	function save(value) {
		const write = async () => {
			await writeFile(tempPath, encrypt(key, JSON.stringify(value)));
			await rename(tempPath, dataPath);
		};
		queue = queue.then(write, write);
		return queue;
	}
	const voterSecret = createHmac("sha256", key).update(VOTER_SECRET_LABEL).digest();
	return { state, voterSecret, save };
}
