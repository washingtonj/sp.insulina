<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { motion, stagger } from '$lib/motion';
	import type { Place } from '$lib/places';
	import PlaceRow from './place-row.svelte';
	import PlaceSkeleton from './place-skeleton.svelte';

	type Props = {
		places: Place[];
		isLoading?: boolean;
		error?: string | null;
		selectedId?: string | null;
		onselect?: (id: string) => void;
		onhistory?: (id: string) => void;
		onretry?: () => void;
		bestDay?: (id: string) => string | undefined;
		selection?: import('$lib/stock-level').StockSelection;
	};

	let {
		places,
		isLoading = false,
		error = null,
		selectedId = null,
		onselect = () => {},
		onhistory,
		onretry = () => {},
		bestDay,
		selection = {}
	}: Props = $props();

	let listElement = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const selected = selectedId;
		if (!selected || !listElement) return;

		listElement
			.querySelector(`[data-place-id="${selected}"]`)
			?.scrollIntoView({ block: 'nearest' });
	});
</script>

<div bind:this={listElement} class="flex flex-col pt-2 pb-4">
	{#if isLoading}
		<div in:fade={{ duration: motion(160) }}>
			{#each Array.from({ length: 6 }, (_, index) => index) as index (index)}
				<PlaceSkeleton />
			{/each}
		</div>
	{:else if error}
		<div
			class="flex flex-col items-center gap-3 px-4 py-8 text-center"
			in:fade={{ duration: motion(160) }}
		>
			<p class="text-muted text-footnote">{error}</p>
			<button
				type="button"
				class="text-ink bg-raised hover:ring-faint/40 press rounded-pill flex h-11 cursor-pointer items-center px-4 transition-shadow hover:ring-1"
				onclick={onretry}
			>
				<span class="text-footnote font-medium">Tentar novamente</span>
			</button>
		</div>
	{:else if places.length === 0}
		<div
			class="flex flex-col items-center justify-center px-4 py-16 text-center"
			in:fade={{ duration: motion(160) }}
		>
			<p class="text-ink text-headline font-extrabold">Nenhum local encontrado</p>
			<p class="text-muted text-footnote mt-1">Tente ajustar os filtros ou mover o mapa</p>
		</div>
	{:else}
		{#each places as place, index (place.id)}
			{#if index > 0}
				<div class="bg-line h-px" in:fade={{ duration: motion(200) }}></div>
			{/if}
			<div
				data-place-id={place.id}
				in:fly={{ y: motion(12), duration: motion(220), delay: stagger(index) }}
			>
				<PlaceRow
					{place}
					selected={place.id === selectedId}
					onselect={() => onselect(place.id)}
					onhistory={onhistory ? () => onhistory(place.id) : undefined}
					bestDay={bestDay?.(place.id)}
					{selection}
				/>
			</div>
		{/each}
	{/if}
</div>
