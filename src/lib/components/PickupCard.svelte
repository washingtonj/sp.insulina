<script lang="ts">
	import type { InsulinEntity } from '$core/entities/insulin';
	import type { PickupEntity } from '$core/entities/pickup';

	type Props = {
		requestedInsulins?: InsulinEntity[];
	} & PickupEntity;

	let { name, address, availability = [], requestedInsulins = [] }: Props = $props();

	const selectedInsulins = $derived(
		availability.filter((q) => requestedInsulins.find((i) => i.code === q.insulin.code))
	);

	const otherInsulins = $derived(
		availability.filter((q) => !requestedInsulins.find((i) => i.code === q.insulin.code))
	);
</script>

<li class="m-0 flex flex-col space-y-4 rounded-lg border border-gray-200 px-6 py-4">
	<span>
		<h3 class="text-xl font-bold">{name}</h3>
		<p class="text-sm text-gray-500">{address.address}</p>
		{#if address.distance}
			<p class="mt-1 text-xs text-blue-600">{address.distance.toFixed(1)} km de distância</p>
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
