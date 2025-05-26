<script lang="ts">
	import InsulinFilter from '$lib/components/InsulinFilter.svelte';
	import PickupCard from '$lib/components/PickupCard.svelte';

	let { data } = $props();
	let filtered = $state([...data.availability]);
	let selectedInsulinCodes = $state([]);
</script>

<main class="m-auto max-w-2xl px-4">
	<div class="flex flex-col py-6">
		<h1 class="text-3xl font-bold">Insulina Capital</h1>
		<p>Disponibilidade de insulina na capital do estado de São Paulo.</p>
	</div>

	<!-- Filter Component -->
	<InsulinFilter data={data.availability} bind:filtered bind:selectedInsulinCodes />

	<div>
		{#if filtered.length === 0}
			<div class="py-8 text-center text-gray-500">
				Nenhum local encontrado com os filtros selecionados.
			</div>
		{:else}
			<ul class="mb-8 flex flex-col space-y-2">
				{#each filtered as pickupObj (pickupObj.pickup.placeName)}
					<PickupCard
						pickup={pickupObj.pickup}
						quantity={pickupObj.quantity}
						{selectedInsulinCodes}
						distanceKm={pickupObj.distanceKm ?? null}
					/>
				{/each}
			</ul>
		{/if}
	</div>
</main>
