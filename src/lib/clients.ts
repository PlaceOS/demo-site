// The client list for the launcher page.
// scripts/fetch-data.ts downloads the data from the private data repo into ./generated/ before dev and build.

import data from './generated/clients.json';
import { parseClients, type Client } from './client-schema.ts';

export type { AppKind, Client, DemoApp } from './client-schema.ts';

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

const pinnedThenByName = (a: Client, b: Client) =>
	Number(b.pinned ?? false) - Number(a.pinned ?? false) || byName(a, b);

/** All clients: pinned first, then A to Z. The apps of each client are A to Z. */
export const CLIENTS: readonly Client[] = parseClients(data)
	.map((client) => ({
		...client,
		apps: client.apps.toSorted(byName)
	}))
	.toSorted(pinnedThenByName);

/** Total number of demo apps across all clients. */
export const APP_COUNT = CLIENTS.reduce((total, client) => total + client.apps.length, 0);

/**
 * Filters clients by a search query (case-insensitive).
 * A client whose name matches keeps all of its apps.
 * For other clients, only the apps whose name matches are kept.
 */
export function searchClients(clients: readonly Client[], query: string): readonly Client[] {
	const q = query.trim().toLowerCase();
	if (!q) return clients;

	const results: Client[] = [];
	for (const client of clients) {
		if (client.name.toLowerCase().includes(q)) {
			results.push(client);
			continue;
		}
		const apps = client.apps.filter((app) => app.name.toLowerCase().includes(q));
		if (apps.length > 0) results.push({ ...client, apps });
	}
	return results;
}
