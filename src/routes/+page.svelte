<script lang="ts">
	let { data } = $props();
</script>

<main class="m-auto max-w-2xl">
	<div class="flex flex-col py-6">
		<h1 class="text-3xl font-bold">Insulina Capital</h1>
		<p>Disponibilidade de insulina na capital do estado de São Paulo.</p>
	</div>
	<div>
		<ul class="flex flex-col space-y-2">
			{#each data.availability as { pickup, quantity } (pickup.placeName)}
				<li class="flex flex-col space-y-4 rounded-lg border border-gray-200 px-6 py-4">
					<span>
						<h3 class="text-xl font-bold">{pickup.placeName}</h3>
						<p class="text-sm text-gray-500">{pickup.address.address}</p>
					</span>

					<div class="text-sm">
						{#each quantity as { insulin, level, quantity: qty } (insulin)}
							<span class="flex space-x-2">
								<p
									class={level === 1
										? 'text-red-600'
										: level === 2
											? 'text-yellow-500'
											: level === 3
												? 'text-green-600'
												: ''}
								>
									{qty}x
								</p>
								<p>
									{insulin.type}
									-
									{insulin.simpleName}
								</p>
							</span>
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	</div>
</main>
