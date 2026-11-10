<!-- One client in the directory: logo plate, name and launch links for its demo apps. -->
<script lang="ts">
	import { APP_ICONS } from '#lib/app-icons.ts';
	import type { Client } from '#lib/clients.ts';

	let { client }: { client: Client } = $props();
</script>

<!-- Mobile: logo and name on one line, apps below. Wider: logo left of name and apps. -->
<li
	class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-5 sm:grid-rows-[auto_1fr] sm:items-start sm:gap-x-8 sm:py-6"
>
	<div
		class="h-14 w-28 rounded-lg border border-line bg-white p-2 sm:row-span-2 sm:h-20 sm:w-40 sm:p-3"
		style:background-color={client.logoBackground}
	>
		<img src="/logos/{client.logo}" alt="" loading="lazy" class="size-full object-contain" />
	</div>

	<h2 class="text-lg font-semibold tracking-tight">{client.name}</h2>

	<div class="col-span-2 sm:col-span-1 sm:col-start-2">
		{#if client.apps.length > 0}
			<ul class="flex flex-wrap gap-2">
				{#each client.apps as app (app.name)}
					{@const Icon = APP_ICONS[app.kind]}
					<li>
						<a
							href={app.url}
							target="_blank"
							rel="external noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pr-4 pl-3 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
						>
							<Icon class="size-4 text-brand" aria-hidden="true" />
							{app.name}
							<span class="sr-only">(opens in a new tab)</span>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-slate">No demo apps yet.</p>
		{/if}
	</div>
</li>
