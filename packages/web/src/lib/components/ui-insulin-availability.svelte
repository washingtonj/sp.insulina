<script lang="ts">
	import UiBadge from './ui-badge.svelte';

	type Props = {
		availability: {
			insulin: {
				id: number;
				simpleName: string;
				type: string;
				variant: string;
			};
			quantity: number;
			level: number;
		}[];
	};

	let { availability }: Props = $props();

	let grouped = $derived.by(() =>
		availability.reduce(
			(acc, item) => {
				const type = item.insulin.type;
				if (!acc[type]) acc[type] = [];
				acc[type].push(item);
				return acc;
			},
			{} as Record<string, typeof availability>
		)
	);
</script>

<div class="flex flex-col gap-3">
	{#each Object.entries(grouped) as [type, items]}
		<div>
			<span class="text-xs font-semibold text-gray-600">{type}</span>
			<span class="mt-0.5 flex flex-wrap gap-1">
				{#each items as item}
					<UiBadge text={`${item.insulin.simpleName} (${item.quantity})`} outline />
				{/each}
			</span>
		</div>
	{/each}
</div>
