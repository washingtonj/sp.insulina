<script lang="ts" module>
	import AppPickupCardChart, {
		type InsulinHistoryEntry
	} from './app-pickup-card-input-chart.svelte';

	export type PickupCardInputProps = {
		type: 'pen' | 'vial' | 'refill';
		nph: {
			quantity: number;
			level: 0 | 1 | 2;
		};
		regular: PickupCardInputProps['nph'];
		history: InsulinHistoryEntry[];
	};
</script>

<script lang="ts">
	let { nph, regular, type, history }: PickupCardInputProps = $props();
	const typeLabels = { pen: 'Caneta', vial: 'Ampola', refill: 'Refill' };
</script>

{#snippet InputColorizedLevel(quantity: number, level: 0 | 1 | 2)}
	<div class="relative flex w-full items-center justify-center">
		<p
			class="flex w-full items-center justify-center gap-1 rounded-md border border-gray-300 bg-gray-100 py-0.5 text-sm font-medium tracking-tight text-black"
		>
			{quantity}
		</p>
		<span
			class="absolute -right-1.5 -bottom-1.5 rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-[0.60rem] font-semibold text-gray-700 shadow"
			style="
				white-space: nowrap;
			"
		>
			{level === 0 ? 'N1' : level === 1 ? 'N2' : 'N3'}
		</span>
	</div>
{/snippet}

<div class="relative flex w-full flex-col items-center rounded-2xl border border-gray-300">
	<div
		class="absolute -top-3 left-1 z-10 items-center justify-between gap-0.5 rounded-2xl bg-black px-2 py-1 text-white shadow"
	>
		<p class="text-xs font-bold">{typeLabels[type]}</p>
	</div>
	<div class="flex items-center gap-x-2 px-6 py-3 text-sm text-gray-800">
		<span class="min-w-[4.5rem] text-center">
			<p class="mb-1 font-semibold text-gray-800">NPH</p>
			{@render InputColorizedLevel(nph.quantity, nph.level)}
		</span>
		<div class="mx-2 h-8 w-px bg-gray-300"></div>
		<span class="min-w-[4.5rem] text-center">
			<p class="mb-1 font-semibold text-gray-800">Regular</p>
			{@render InputColorizedLevel(regular.quantity, regular.level)}
		</span>
	</div>
	<AppPickupCardChart {history} />
</div>
