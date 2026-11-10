# demo-site

A modern version of the PlaceOS demo site ([demo.place.tech](https://demo.place.tech/)).

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) with Svelte 5 runes and TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Lucide](https://lucide.dev/guide/packages/lucide-svelte) icons (`@lucide/svelte`)
- [Vite](https://vite.dev)
- [Bun](https://bun.sh) as the package manager and script runner

## Development

Install the dependencies:

```sh
bun install
```

Give the site access to the client data. Copy `.env.example` to `.env` and set one of these (see [Client data](#client-data)):

- `DEMO_DATA_TOKEN`: a GitHub token that can read `PlaceOS/demo-data`.
- `DEMO_DATA_DIR`: the path to a local clone of `PlaceOS/demo-data`, for example `../demo-data`.

Start the development server:

```sh
bun run dev
```

`bun run dev` and `bun run build` get the client data first. To get it again without a restart, run `bun run data`. `bun run check` needs the data, so run `bun run data` once before you use it.

Do the checks before you push:

```sh
bun run check   # type check
bun run lint    # prettier and eslint
bun run format  # fix formatting
```

## Client data

The site is one page: a list of PlaceOS clients and their demo apps. The client data is not in this repo. It is in the private repo `PlaceOS/demo-data`:

- `clients.json`: the clients and their apps.
- `logos/`: one logo file for each client.

`scripts/fetch-data.ts` gets the data at build time. It reads from `DEMO_DATA_DIR` if it is set. If not, it reads from GitHub with `DEMO_DATA_TOKEN`. It writes the data to `src/lib/generated/clients.json` and `static/logos/`. Git ignores both folders.

The script checks all the data before it writes anything (`parseClients` in `src/lib/client-schema.ts`). If the data is not valid, the build fails with the name of the bad field, and the live site does not change. The script also stops if:

- A logo is larger than 1 MB. It shows a warning for logos larger than 150 KB, because the page shows logos at a height of 80 px or less.
- A request to GitHub takes more than 15 seconds.

Other settings:

- `DEMO_DATA_REPO`: a different data repo, as `owner/name`. The default is `PlaceOS/demo-data`.
- `DEMO_DATA_REF`: a branch, tag or commit. The default is the default branch of the repo.

The page shows pinned clients (`pinned: true`) first, then the other clients A to Z. Apps are also A to Z.

`src/lib/app-icons.ts` sets the Lucide icon for each kind of app. To add a kind, add it to `APP_KINDS` in `src/lib/client-schema.ts`. TypeScript then tells you to add its icon.

## Single-page app

The site is a single-page app (SPA). The browser renders all pages.

- `src/routes/+layout.ts` sets `ssr = false`.
- `adapter-static` writes the site to `build/`. It also writes a `200.html` fallback shell.

Build the site and preview the build:

```sh
bun run build
bun run preview
```

## Deployment

The site deploys to [Vercel](https://vercel.com). `vercel.json` sets the build:

- Vercel installs with `bun install` and builds with `bun run build`. The build gets the client data first.
- Vercel serves the static files in `build/`.
- A rewrite sends all paths that are not files to `200.html`. The client router then shows the correct page.

Set `DEMO_DATA_TOKEN` in the Vercel project's environment variables. Use a fine-grained GitHub token with access to `PlaceOS/demo-data` only, and the **Contents: Read-only** permission.

To show data changes on the live site, Vercel must build the site again. The data repo has a GitHub Action that starts a new build through a Vercel deploy hook once per day, if its `main` branch changed since the last build. You can also run the Action by hand.

Use the `vercel.json` file. Do not use the SvelteKit framework preset. If you set adapter options, `adapter-static` does not use its Vercel zero-config mode, and that mode does not add an SPA fallback route.

## Brand

The brand color is `#c92366`. Use it with the Tailwind `brand` color, for example `text-brand` or `bg-brand`. `src/routes/layout.css` defines it.
