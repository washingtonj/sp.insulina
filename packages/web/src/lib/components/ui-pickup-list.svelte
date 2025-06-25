<script lang="ts">
	import UiPickupCard from './ui-pickup-card.svelte';
	export let pickups: any[] = [];
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<div class="flex flex-col gap-4">
	{#if pickups.length === 0}
		<div class="py-8 text-center text-sm text-gray-400">Nenhum local encontrado.</div>
	{:else}
		{#each pickups as pickup (pickup.id)}
			<UiPickupCard
				id={'pickup-' + pickup.id}
				name={pickup.name}
				address={pickup.address.address}
				businessHourTags={pickup.businessHourTags}
				availability={pickup.availability}
				on:click={() => dispatch('pickupClick', pickup.id)}
			/>
		{/each}
	{/if}
</div>
