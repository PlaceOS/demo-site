// Gets the client list and logos from the private data repo.
// `bun run dev` and `bun run build` run this first. Run it alone with `bun run data`.
//
// Settings (environment variables; Bun also reads them from .env):
//   DEMO_DATA_DIR    Local folder with clients.json and logos/. If set, the script does not use GitHub.
//   DEMO_DATA_TOKEN  GitHub token that can read the data repo. Necessary if DEMO_DATA_DIR is not set.
//   DEMO_DATA_REPO   Data repo as owner/name. Default: PlaceOS/demo-data.
//   DEMO_DATA_REF    Branch, tag or commit. Default: the default branch of the repo.
//
// Output (git ignores both):
//   src/lib/generated/clients.json
//   static/logos/<file>

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseClients } from '../src/lib/client-schema.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_OUT = path.join(ROOT, 'src/lib/generated/clients.json');
const LOGOS_OUT = path.join(ROOT, 'static/logos');

const DEFAULT_REPO = 'PlaceOS/demo-data';
const MAX_JSON_BYTES = 1_000_000;
const MAX_LOGO_BYTES = 1_000_000;
/** Logos larger than this still work, but slow the page. */
const LOGO_WARN_BYTES = 150_000;
const REQUEST_TIMEOUT_MS = 15_000;
const PARALLEL_DOWNLOADS = 8;

/** Reads one file from the data source, relative to its root. */
type ReadDataFile = (file: string, maxBytes: number) => Promise<Uint8Array>;

function assertSize(file: string, bytes: number, maxBytes: number) {
	if (bytes > maxBytes) throw new Error(`${file} is ${bytes} bytes. The limit is ${maxBytes}.`);
}

function localSource(dir: string): ReadDataFile {
	return async (file, maxBytes) => {
		const bytes = await readFile(path.join(dir, file));
		assertSize(file, bytes.byteLength, maxBytes);
		return bytes;
	};
}

function githubSource(repo: string, token: string, ref: string | undefined): ReadDataFile {
	return async (file, maxBytes) => {
		const filePath = file.split('/').map(encodeURIComponent).join('/');
		const url = new URL(`https://api.github.com/repos/${repo}/contents/${filePath}`);
		if (ref) url.searchParams.set('ref', ref);

		const res = await fetch(url, {
			headers: {
				Accept: 'application/vnd.github.raw+json',
				Authorization: `Bearer ${token}`,
				'User-Agent': 'demo-site-build',
				'X-GitHub-Api-Version': '2022-11-28'
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
		});

		if (!res.ok) {
			const hint =
				res.status === 401
					? ' Check DEMO_DATA_TOKEN.'
					: res.status === 403 || res.status === 404
						? ' Check DEMO_DATA_REPO, DEMO_DATA_REF and that the token can read the repo.'
						: '';
			throw new Error(`${repo}/${file}: GitHub returned ${res.status} ${res.statusText}.${hint}`);
		}

		assertSize(file, Number(res.headers.get('content-length') ?? 0), maxBytes);
		const bytes = new Uint8Array(await res.arrayBuffer());
		assertSize(file, bytes.byteLength, maxBytes);
		return bytes;
	};
}

function pickSource(): { read: ReadDataFile; label: string } {
	const dir = process.env.DEMO_DATA_DIR;
	if (dir) {
		const resolved = path.resolve(ROOT, dir);
		return { read: localSource(resolved), label: resolved };
	}

	const token = process.env.DEMO_DATA_TOKEN;
	if (!token) {
		throw new Error(
			'Set DEMO_DATA_TOKEN (a GitHub token that can read the data repo) or DEMO_DATA_DIR (a local copy). See README.md.'
		);
	}

	const repo = process.env.DEMO_DATA_REPO || DEFAULT_REPO;
	if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`DEMO_DATA_REPO must be owner/name.`);

	const ref = process.env.DEMO_DATA_REF || undefined;
	return { read: githubSource(repo, token, ref), label: ref ? `${repo}@${ref}` : repo };
}

async function main() {
	const { read, label } = pickSource();

	const json = new TextDecoder().decode(await read('clients.json', MAX_JSON_BYTES));
	const clients = parseClients(JSON.parse(json));

	// Get all logos before writing anything, so a failed run keeps the last good output.
	const logoFiles = [...new Set(clients.map((client) => client.logo))];
	const logos = new Map<string, Uint8Array>();
	for (let i = 0; i < logoFiles.length; i += PARALLEL_DOWNLOADS) {
		const batch = logoFiles.slice(i, i + PARALLEL_DOWNLOADS);
		const results = await Promise.all(
			batch.map(async (file) => [file, await read(`logos/${file}`, MAX_LOGO_BYTES)] as const)
		);
		for (const [file, bytes] of results) {
			if (bytes.byteLength > LOGO_WARN_BYTES) {
				console.warn(`Warning: logos/${file} is ${Math.round(bytes.byteLength / 1000)} KB.`);
			}
			logos.set(file, bytes);
		}
	}

	await rm(LOGOS_OUT, { recursive: true, force: true });
	await mkdir(LOGOS_OUT, { recursive: true });
	await mkdir(path.dirname(DATA_OUT), { recursive: true });
	await Promise.all(
		[...logos].map(([file, bytes]) => writeFile(path.join(LOGOS_OUT, file), bytes))
	);
	await writeFile(DATA_OUT, JSON.stringify(clients, null, '\t') + '\n');

	const appCount = clients.reduce((total, client) => total + client.apps.length, 0);
	console.log(
		`Got ${clients.length} clients, ${appCount} apps and ${logos.size} logos from ${label}.`
	);
}

try {
	await main();
} catch (error) {
	console.error(`fetch-data: ${error instanceof Error ? error.message : String(error)}`);
	process.exit(1);
}
