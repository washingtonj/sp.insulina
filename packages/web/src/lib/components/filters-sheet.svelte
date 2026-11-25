<script lang="ts">
	import { Dialog } from 'bits-ui';
	import X from 'phosphor-svelte/lib/X';
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

<Dialog.Root bind:open>
	<Dialog.Trigger
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
	</Dialog.Trigger>

	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />

		<Dialog.Content
			class="rounded-t-sheet shadow-float md:rounded-b-sheet bg-surface animate-sheet-up fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col outline-none"
		>
			<div class="flex shrink-0 items-center justify-between px-4 py-4">
				<div>
					<Dialog.Title class="text-ink text-headline font-extrabold">Filtros</Dialog.Title>
					<Dialog.Description class="text-muted text-footnote mt-1">
						Selecione os critérios para filtrar os locais
					</Dialog.Description>
				</div>
				<Dialog.Close
					class="text-muted hover:text-ink rounded-pill flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center"
					aria-label="Fechar filtros"
				>
					<X size={20} />
				</Dialog.Close>
			</div>

			<div class="flex-1 space-y-9 overflow-y-auto p-4">
				<FiltersPanel
					values={draft}
					{hasLocation}
					idPrefix="mobile-"
					onchange={(values) => (draft = values)}
				/>
			</div>

			<div class="shrink-0 p-4">
				<button
					type="button"
					class="rounded-pill bg-ink text-canvas text-footnote w-full py-3.5 font-semibold hover:opacity-90"
					onclick={apply}
				>
					Aplicar filtros
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
