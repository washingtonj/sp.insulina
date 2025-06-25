<script lang="ts">
	import UiBadge from './ui-badge.svelte';

	type Props = {
		id?: string;
		name: string;
		address: string;
		businessHourTags?: string[];
		availability?: {
			insulin: {
				id: number;
				simpleName: string;
				type: string;
				variant: string;
			};
			quantity: number;
			level: number;
		}[];
		selected?: boolean;
		onClick?: () => void;
		distance?: number;
	};

	let {
		id = 'pickup-card',
		name,
		address,
		businessHourTags = [],
		availability = [],
		onClick = () => {},
		selected = false,
		distance = undefined
	}: Props = $props();

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

<button
	{id}
	class={[
		'flex cursor-pointer flex-col gap-4 rounded-xl bg-white p-4 text-left shadow-sm transition-all duration-300',
		selected ? 'ring-2 ring-black' : 'ring ring-gray-300'
	]}
	onclick={onClick}
>
	<div class="flex flex-col gap-2">
		<div>
			<h3 class="text-xl font-bold">{name}</h3>
			<p class="text-sm text-gray-400">{address}</p>
			{#if distance != null}
				<p class="mt-1 text-xs text-gray-500">
					{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
				</p>
			{/if}
		</div>
		<div class="flex gap-0.5">
			{#each businessHourTags as tag}
				<UiBadge text={tag} />
			{/each}
		</div>
	</div>

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
</button>
