// Types and validation for the client data (clients.json in the private data repo).
// scripts/fetch-data.ts validates the data before it writes it, and the app validates it again on load.

/** All kinds of demo app. Each kind has its own icon (see app-icons.ts). */
export const APP_KINDS = [
	'backoffice',
	'bookings',
	'catering',
	'concierge',
	'control',
	'kiosk',
	'room',
	'social',
	'staff',
	'timetable'
] as const;

export type AppKind = (typeof APP_KINDS)[number];

/** One demo app. It opens in a new tab. */
export interface DemoApp {
	kind: AppKind;
	name: string;
	url: `https://${string}`;
}

/** One client and its demo apps. */
export interface Client {
	id: string;
	name: string;
	/** File name of the logo in the data repo's `logos/` folder, e.g. `cisco.png`. */
	logo: string;
	/** Hex plate color for logos that need a dark or tinted background. */
	logoBackground?: string;
	/** Pinned clients show before all others. */
	pinned?: boolean;
	apps: DemoApp[];
}

/** Upper bounds for the data. Larger input fails validation. */
export const LIMITS = {
	clients: 500,
	appsPerClient: 50,
	textLength: 200,
	urlLength: 2000
} as const;

/** Logo file names: no folders, and only image types that browsers show in an <img>. */
export const LOGO_FILE = /^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|svg|webp)$/i;

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const APP_KIND_SET: ReadonlySet<string> = new Set(APP_KINDS);

function fail(path: string, message: string): never {
	throw new Error(`clients.json${path}: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAppKind(value: string): value is AppKind {
	return APP_KIND_SET.has(value);
}

function isHttpsUrl(value: string): value is `https://${string}` {
	return value.startsWith('https://') && URL.canParse(value);
}

function text(value: unknown, path: string): string {
	if (typeof value !== 'string' || value.trim() === '' || value.length > LIMITS.textLength) {
		fail(path, `must be a non-empty string of ${LIMITS.textLength} characters or less`);
	}
	return value;
}

function parseApp(raw: unknown, path: string): DemoApp {
	if (!isRecord(raw)) fail(path, 'must be an object');

	const kind = text(raw.kind, `${path}.kind`);
	if (!isAppKind(kind)) fail(`${path}.kind`, `must be one of: ${APP_KINDS.join(', ')}`);

	const url = raw.url;
	if (typeof url !== 'string' || url.length > LIMITS.urlLength || !isHttpsUrl(url)) {
		fail(`${path}.url`, 'must be an https:// URL');
	}

	return { kind, name: text(raw.name, `${path}.name`), url };
}

function parseClient(raw: unknown, path: string): Client {
	if (!isRecord(raw)) fail(path, 'must be an object');

	const logo = text(raw.logo, `${path}.logo`);
	if (!LOGO_FILE.test(logo)) {
		fail(`${path}.logo`, 'must be a file name in logos/ (.png, .jpg, .svg or .webp)');
	}

	if (!Array.isArray(raw.apps) || raw.apps.length > LIMITS.appsPerClient) {
		fail(`${path}.apps`, `must be an array of ${LIMITS.appsPerClient} apps or less`);
	}

	const client: Client = {
		id: text(raw.id, `${path}.id`),
		name: text(raw.name, `${path}.name`),
		logo,
		apps: raw.apps.map((app, i) => parseApp(app, `${path}.apps[${i}]`))
	};

	if (raw.logoBackground !== undefined) {
		if (typeof raw.logoBackground !== 'string' || !HEX_COLOR.test(raw.logoBackground)) {
			fail(`${path}.logoBackground`, 'must be a hex color, e.g. #0a0d2e');
		}
		client.logoBackground = raw.logoBackground;
	}

	if (raw.pinned !== undefined) {
		if (typeof raw.pinned !== 'boolean') fail(`${path}.pinned`, 'must be true or false');
		client.pinned = raw.pinned;
	}

	return client;
}

/**
 * Checks that unknown JSON is a valid client list and returns it typed.
 * Throws an error that names the bad field, e.g. `clients.json[3].apps[0].url: must be an https:// URL`.
 */
export function parseClients(input: unknown): Client[] {
	if (!Array.isArray(input) || input.length > LIMITS.clients) {
		fail('', `must be an array of ${LIMITS.clients} clients or less`);
	}

	const clients = input.map((raw, i) => parseClient(raw, `[${i}]`));

	const ids = new Set<string>();
	for (const [i, client] of clients.entries()) {
		if (ids.has(client.id)) fail(`[${i}].id`, `"${client.id}" is used by more than one client`);
		ids.add(client.id);
	}

	return clients;
}
