<script lang="ts">
	import { Search, X } from '@lucide/svelte';
	import ClientRow from '#lib/components/ClientRow.svelte';
	import { APP_COUNT, CLIENTS, searchClients } from '#lib/clients.ts';
	import placeosLogo from '#lib/assets/placeos-logo.svg';

	let query = $state('');
	let searchInput: HTMLInputElement | undefined = $state();

	const results = $derived(searchClients(CLIENTS, query));

	function clearSearch() {
		query = '';
		searchInput?.focus();
	}
</script>

<header class="bg-ink text-white">
	<div class="mx-auto flex max-w-5xl flex-col gap-10 px-4 pt-6 pb-12 sm:px-8">
		<img src={placeosLogo} alt="PlaceOS" class="h-8 w-fit" />

		<div class="flex flex-col gap-5">
			<div class="flex flex-col gap-2">
				<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Client demos</h1>
				<p class="text-white/70">Find a client, then open a demo app in a new tab.</p>
			</div>

			<div class="relative max-w-xl">
				<Search
					class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate"
					aria-hidden="true"
				/>
				<input
					bind:this={searchInput}
					bind:value={query}
					type="search"
					maxlength="100"
					placeholder="Search clients or apps"
					aria-label="Search clients or apps"
					class="w-full rounded-xl bg-white py-3.5 pr-12 pl-12 text-ink placeholder:text-slate focus-visible:outline-brand [&::-webkit-search-cancel-button]:hidden"
				/>
				{#if query}
					<button
						type="button"
						onclick={clearSearch}
						aria-label="Clear search"
						class="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate hover:text-ink"
					>
						<X class="size-5" aria-hidden="true" />
					</button>
				{/if}
			</div>
		</div>
	</div>
</header>

<main class="mx-auto max-w-5xl px-4 py-8 sm:px-8">
	<p class="text-sm text-slate" aria-live="polite">
		{#if query.trim()}
			{results.length} of {CLIENTS.length} clients match
		{:else}
			{CLIENTS.length} clients, {APP_COUNT} apps
		{/if}
	</p>

	{#if results.length > 0}
		<ul class="divide-y divide-line">
			{#each results as client (client.id)}
				<ClientRow {client} />
			{/each}
		</ul>
	{:else}
		<div class="flex flex-col items-start gap-3 py-12">
			<p>No clients or apps match “{query.trim()}”.</p>
			<button
				type="button"
				onclick={clearSearch}
				class="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-brand"
			>
				Clear search
			</button>
		</div>
	{/if}
</main>
