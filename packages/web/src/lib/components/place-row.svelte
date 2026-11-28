<script lang="ts">
	import { CalendarBlank, Clock, MapPin } from 'phosphor-svelte';
	import { businessHourLabel, summarizeAvailability, type Place } from '$lib/places';
	import { STOCK_LEVEL_COLOR, stockLevel, type StockSelection } from '$lib/stock-level';
	import { formatRelativeTime } from '$lib/utils/date';
	import { formatDistance } from '$lib/utils/distance';

	type Props = {
		place: Place;
		selected?: boolean;
		onselect?: () => void;
		onhistory?: () => void;
		bestDay?: string;
		selection?: StockSelection;
	};

	let {
		place,
		selected = false,
		onselect = () => {},
		onhistory,
		bestDay,
		selection = {}
	}: Props = $props();

	let formats = $derived(summarizeAvailability(place.availability));
	let level = $derived(stockLevel(place, selection));
</script>

<div
	class={[
		'relative flex w-full flex-col px-4 pt-3 pb-2 transition-colors',
		{
			'bg-raised ring-ink ring-2 ring-inset': selected,
			'hover:bg-raised': !selected
		}
	]}
>
	<button
		type="button"
		class="absolute inset-0 z-0 cursor-pointer"
		aria-label={`Selecionar ${place.name}`}
		onclick={onselect}
	></button>

	<div class="pointer-events-none relative z-10 flex flex-col gap-1">
		<div class="flex items-center gap-2">
			<span
				class="h-2 w-2 shrink-0 rounded-full"
				style={`background:${STOCK_LEVEL_COLOR[level]}`}
				aria-hidden="true"
			></span>
			<h2 class="text-headline font-extrabold">{place.name}</h2>
		</div>
		<p class="text-footnote text-faint leading-snug">{place.address.address}</p>
	</div>

	<div
		class="text-muted pointer-events-none relative z-10 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1"
	>
		<span class="flex items-center gap-2">
			<Clock size={14} />
			<p class="text-footnote">{businessHourLabel(place.businessHourTags)}</p>
		</span>

		{#if place.distance !== undefined}
			<span class="flex items-center gap-2">
				<MapPin size={14} />
				<p class="text-footnote">{formatDistance(place.distance)}</p>
			</span>
		{/if}

		{#if bestDay}
			<span class="flex items-center gap-2">
				<CalendarBlank size={14} />
				<p class="text-footnote">Melhor dia: {bestDay}</p>
			</span>
		{/if}
	</div>

	<div class="pointer-events-none relative z-10 mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
		{#each formats as format (format.label)}
			<span class="text-footnote tabular whitespace-nowrap">
				<span class="text-ink font-medium">{format.label}</span>
				{#if format.hasStock}
					<span class="text-muted">{format.nph} NPH · {format.regular} Regular</span>
				{:else}
					<span class="text-faint">sem estoque</span>
				{/if}
			</span>
		{/each}
	</div>

	<div class="relative z-10 mt-2 flex min-h-9 items-center justify-between gap-3">
		<span class="text-caption text-faint">
			{#if place.checkedAt}
				Atualizado {formatRelativeTime(place.checkedAt)}
			{/if}
		</span>

		{#if onhistory}
			<button
				type="button"
				class="text-muted hover:text-ink text-caption pointer-events-auto -my-1 -mr-2 flex min-h-11 cursor-pointer items-center px-2 font-medium underline transition-colors"
				onclick={onhistory}
			>
				Histórico
			</button>
		{/if}
	</div>
</div>
