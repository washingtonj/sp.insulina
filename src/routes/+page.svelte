<script lang="ts">
	import InsulinFilter from '$lib/components/InsulinFilter.svelte';
	import PickupCard from '$lib/components/PickupCard.svelte';
	import { userState, setLocation } from '$lib/stores/user.svelte.js';
	import type { InsulinEntity } from '$core/entities/insulin.js';
	import { calcPickupDistance, extractAvailableInsulins } from '$core/entities/pickup.js';
	import { applyFilters } from '$lib/utils/insulinFilters.js';
	import { applySorters } from '$lib/utils/insulinSorters.js';

	let { data } = $props();
	let { pickups } = data;
	let { location } = userState;

	let searchQuery = $state('');
	let isOrderByNearest = $state(false);
	let requestedInsulins = $state<InsulinEntity[]>([]);

	let availableInsulins = $derived(extractAvailableInsulins(pickups));

	let pickupsWithLocation = $derived.by(() => {
		if (!location.data) return pickups;

		return pickups.map((pickup) =>
			calcPickupDistance(pickup, {
				lat: location.data!.latitude,
				lng: location.data!.longitude
			})
		);
	});

	let pickupsFiltered = $derived.by(() => {
		let filtered = applyFilters(pickupsWithLocation, { searchQuery, requestedInsulins });
		filtered = applySorters(filtered, requestedInsulins);
		return filtered;
	});

	let totals = $derived({ data: pickups.length, filtered: pickupsFiltered.length });
</script>

<main class="relative m-auto flex max-w-full flex-col">
	<div class="flex flex-col lg:flex-row">
		<!-- Left sidebar - fixed position -->
		<div class="flex flex-col gap-4 p-4 lg:sticky lg:top-0 lg:h-screen lg:max-w-xl">
			<div class="flex flex-col">
				<h1 class="flex flex-col items-start text-3xl font-bold">
					<div class="flex items-center">
						<span class="text-blue-600">sp.</span>
						<span class="text-gray-800">insulina</span>
					</div>
					<div class="-mt-3 ml-8 w-32">
						<svg
							viewBox="0 0 100 15"
							xmlns="http://www.w3.org/2000/svg"
							class="fill-current text-blue-400"
						>
							<path d="M0,7.5 C15,0 35,15 50,7.5 C65,0 85,15 100,7.5" />
						</svg>
					</div>
				</h1>
			</div>

			<!-- Filter Component -->
			<InsulinFilter
				bind:requestedInsulins
				bind:searchQuery
				bind:isOrderByNearest
				{availableInsulins}
				{totals}
				{location}
				onOrderByNearest={() => {
					if (!location.data) setLocation();
				}}
			/>

			<p class="rounded-lg bg-gray-100 p-4 text-sm text-gray-500">
				Interface simplificada para visualização dos dados públicos do sistema <b>e-saude</b> da prefeitura
				de São Paulo. Facilitamos a localização de insumos na capital com informações geográficas adicionais.
			</p>
			<p class="rounded-lg bg-gray-100 p-4 text-sm text-gray-500">
				<a
					aria-label="Link para o portal e-saude"
					aria-labelledby="link-e-saude"
					href="https://e-saudesp.prefeitura.sp.gov.br/#/remedio-na-hora"
					target="_blank"
					class="text-blue-600 hover:underline"
				>
					https://e-saudesp.prefeitura.sp.gov.br/#/remedio-na-hora
				</a>
			</p>
		</div>

		<!-- Right content - scrollable -->
		<div class="flex-1 p-4">
			{#if pickupsFiltered.length === 0}
				<div class="py-8 text-center text-gray-500">
					Nenhum local encontrado com os filtros selecionados.
				</div>
			{:else}
				<ul class="mb-8 flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-4">
					{#each pickupsFiltered as { address, availability, name, businessHours } (name)}
						<PickupCard {businessHours} {name} {address} {availability} {requestedInsulins} />
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</main>
