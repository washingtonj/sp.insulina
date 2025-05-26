<script lang="ts">
	import InsulinFilter from '$lib/components/InsulinFilter.svelte';
	import PickupCard from '$lib/components/PickupCard.svelte';

	let { data } = $props();
	let filtered = $state([...data.availability]);
	let selectedInsulinCodes = $state([]);
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
			<InsulinFilter data={data.availability} bind:filtered bind:selectedInsulinCodes />

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
			{#if filtered.length === 0}
				<div class="py-8 text-center text-gray-500">
					Nenhum local encontrado com os filtros selecionados.
				</div>
			{:else}
				<ul class="mb-8 flex flex-col space-y-2 lg:grid lg:grid-cols-2 lg:gap-4">
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
	</div>
</main>
