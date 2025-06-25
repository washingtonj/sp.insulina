<script lang="ts">
	import UiInsulinAvailability from './ui-insulin-availability.svelte';
	import UiBadge from './ui-badge.svelte';

	export let id: string | undefined = undefined;
	export let name: string;
	export let address: string;
	export let businessHourTags: string[] = [];
	export let availability: {
		insulin: {
			id: number;
			simpleName: string;
			type: string;
			variant: string;
		};
		quantity: number;
		level: number;
	}[] = [];
</script>

<div
	class="flex cursor-pointer flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:ring-2 hover:ring-black"
	{id}
	on:click
>
	<div class="flex flex-col gap-2">
		<div>
			<h3 class="text-xl font-bold">{name}</h3>
			<p class="text-sm text-gray-400">{address}</p>
		</div>
		<div class="flex gap-0.5">
			{#each businessHourTags as tag}
				<UiBadge text={tag} />
			{/each}
		</div>
	</div>

	<UiInsulinAvailability {availability} />
</div>
