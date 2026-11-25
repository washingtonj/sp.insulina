<script lang="ts">
	import { Popover } from 'bits-ui';
	import Funnel from 'phosphor-svelte/lib/Funnel';
	import { NO_FILTERS, activeFilterCount, type Filters } from '$lib/places';
	import FiltersPanel from './filters-panel.svelte';

	type Props = {
		filters: Filters;
		hasLocation: boolean;
		onapply: (filters: Filters) => void;
		compact?: boolean;
	};

	let { filters, hasLocation, onapply, compact = false }: Props = $props();

	let open = $state(false);
	let draft = $state<Filters>({ ...NO_FILTERS });
	let count = $derived(activeFilterCount(filters));

	$effect(() => {
		if (!open) draft = { ...filters };
	});

	function apply() {
		onapply(draft);
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={compact
			? 'rounded-pill text-ink hover:text-muted press flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center transition-colors'
			: 'text-ink cursor-pointer font-semibold hover:underline'}
		aria-label="Filtros"
		title="Filtros"
	>
		{#if compact}
			<span class="relative flex items-center justify-center">
				<Funnel size={16} weight={count > 0 ? 'fill' : 'regular'} />
				{#if count > 0}
					<span
						class="bg-ink text-canvas rounded-pill text-caption tabular absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center px-1 font-semibold"
					>
						{count}
					</span>
				{/if}
			</span>
		{:else}
			Filtros
			{#if count > 0}
				<span class="text-muted ml-1">({count})</span>
			{/if}
		{/if}
	</Popover.Trigger>

	<Popover.Portal>
		<Popover.Content
			class="rounded-card shadow-float border-line bg-surface animate-pop-in z-50 w-[22rem] border p-5"
			sideOffset={8}
			align="end"
		>
			<div class="mb-4">
				<h3 class="text-ink text-headline font-extrabold">Filtros</h3>
				<p class="text-muted text-footnote mt-1">Selecione os critérios para filtrar os locais</p>
			</div>

			<div class="flex flex-col gap-9">
				<FiltersPanel
					values={draft}
					{hasLocation}
					idPrefix="desktop-"
					onchange={(values) => (draft = values)}
				/>
			</div>

			<div class="mt-6 flex justify-end">
				<button
					type="button"
					class="rounded-pill bg-ink text-canvas text-footnote px-5 py-3.5 font-semibold hover:opacity-90"
					onclick={apply}
				>
					Aplicar filtros
				</button>
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
