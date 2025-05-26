<script lang="ts">
	import type { AvailabilityEntity } from '../../core/entities/availability';

	type Props = {
		selectedInsulinCodes?: string[];
		distanceKm?: number | null;
	} & AvailabilityEntity;

	let { pickup, quantity = [], selectedInsulinCodes = [], distanceKm = null }: Props = $props();

	const selectedInsulins = $derived(
		quantity.filter((q) => selectedInsulinCodes.includes(q.insulin.code))
	);

	const otherInsulins = $derived(
		quantity.filter((q) => !selectedInsulinCodes.includes(q.insulin.code))
	);
</script>

<li class="flex flex-col space-y-4 rounded-lg border border-gray-200 px-6 py-4">
	<span>
		<h3 class="text-xl font-bold">{pickup.placeName}</h3>
		<p class="text-sm text-gray-500">{pickup.address.address}</p>
		{#if distanceKm !== null}
			<p class="mt-1 text-xs text-blue-600">Distância: {distanceKm.toFixed(1)} km</p>
		{/if}
	</span>

	{#if selectedInsulins.length > 0}
		<div>
			<div class="mb-1 text-xs font-semibold text-gray-700">Insulinas Selecionadas</div>
			<div class="text-sm">
				{#each selectedInsulins as { insulin, level, quantity } (insulin.code)}
					<span class="mb-1 flex items-center space-x-2">
						<p
							class={level === 1
								? 'text-red-600'
								: level === 2
									? 'text-yellow-500'
									: level === 3
										? 'text-green-600'
										: ''}
						>
							{quantity}x
						</p>
						<p>
							{insulin.type} - {insulin.simpleName}
						</p>
						<span class="ml-2 text-xs text-gray-400">Nível {level}</span>
					</span>
				{/each}
			</div>
		</div>
	{/if}

	{#if otherInsulins.length > 0}
		<div class="mt-2">
			<div class="mb-1 text-xs font-semibold text-gray-400">Outras Insulinas Disponíveis</div>
			<div class="text-sm">
				{#each otherInsulins as { insulin, level, quantity } (insulin.code)}
					<span class="mb-1 flex items-center space-x-2 opacity-70">
						<p
							class={level === 1
								? 'text-red-600'
								: level === 2
									? 'text-yellow-500'
									: level === 3
										? 'text-green-600'
										: ''}
						>
							{quantity}x
						</p>
						<p>
							{insulin.type} - {insulin.simpleName}
						</p>
						<span class="ml-2 text-xs text-gray-400">Nível {level}</span>
					</span>
				{/each}
			</div>
		</div>
	{/if}
</li>
