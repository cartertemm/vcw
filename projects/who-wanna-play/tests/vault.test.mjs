import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decrypt, encrypt, openVault } from "../vault.mjs";

async function tempDir(t) {
	const dir = await mkdtemp(join(tmpdir(), "wwp-vault-"));
	t.after(() => rm(dir, { recursive: true, force: true }));
	return dir;
}

test("encrypt and decrypt round trip with a fresh IV each time", () => {
	const key = Buffer.alloc(32, 1);
	const a = encrypt(key, "hello");
	const b = encrypt(key, "hello");
	assert.notDeepEqual(a, b);
	assert.equal(decrypt(key, a), "hello");
	assert.throws(() => decrypt(Buffer.alloc(32, 2), a));
});

test("openVault makes a key, saves encrypted data, and loads it again", async (t) => {
	const dir = await tempDir(t);
	const first = await openVault(join(dir, "data"));
	assert.equal(first.state, null);
	await first.save({ activities: { x: { name: "Secret plan" } } });
	const raw = await readFile(join(dir, "data", "data.enc"));
	assert.ok(!raw.toString("latin1").includes("Secret plan"));
	const key = await readFile(join(dir, "data", "secret.key"));
	assert.equal(key.length, 32);
	const second = await openVault(join(dir, "data"));
	assert.deepEqual(second.state, { activities: { x: { name: "Secret plan" } } });
	assert.deepEqual(second.voterSecret, first.voterSecret);
	assert.notDeepEqual(second.voterSecret, key);
});

test("openVault writes the key readable by its owner only", { skip: process.platform === "win32" }, async (t) => {
	const dir = await tempDir(t);
	await openVault(dir);
	assert.equal((await stat(join(dir, "secret.key"))).mode & 0o777, 0o600);
});

test("openVault refuses to start with a wrong key", async (t) => {
	const dir = await tempDir(t);
	const vault = await openVault(dir);
	await vault.save({ activities: {} });
	await writeFile(join(dir, "secret.key"), Buffer.alloc(32, 9));
	await assert.rejects(openVault(dir), /Could not decrypt/);
});

test("openVault refuses to start when data exists but the key is gone", async (t) => {
	const dir = await tempDir(t);
	const vault = await openVault(dir);
	await vault.save({ activities: {} });
	await rm(join(dir, "secret.key"));
	await assert.rejects(openVault(dir), /secret\.key is missing/);
});

test("saves run in order and the last one wins", async (t) => {
	const dir = await tempDir(t);
	const vault = await openVault(dir);
	await Promise.all([vault.save({ n: 1 }), vault.save({ n: 2 }), vault.save({ n: 3 })]);
	assert.deepEqual((await openVault(dir)).state, { n: 3 });
});
