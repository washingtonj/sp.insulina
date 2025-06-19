<script lang="ts" module>
	import UiBadge from './ui-badge.svelte';
	import PickupCardInput, { type PickupCardInputProps } from './app-pickup-card-input.svelte';

	export type PickupCardProps = {
		pickupName: string;
		pickupAddress: string;
		businessHours: string[];
		data: PickupCardInputProps[];
	};
</script>

<script lang="ts">
	let { pickupName, pickupAddress, businessHours, data }: PickupCardProps = $props();
</script>

<div class="rounded-2xl border border-gray-300 p-4">
	<div class="mb-2.5 uppercase">
		<h2 class="text-2xl font-bold">{pickupName}</h2>
		<p class="text-sm text-gray-500">{pickupAddress}</p>
	</div>
	<div class="flex items-center gap-x-2">
		{#each businessHours as hour}
			<UiBadge text={hour} />
		{/each}
	</div>

	<ul class="mt-10 flex w-full flex-col gap-x-3 gap-y-5 sm:flex-row sm:flex-wrap">
		{#each data as input}
			<li class="w-full min-w-0 flex-1 sm:w-[220px]">
				<PickupCardInput
					type={input.type}
					nph={input.nph}
					regular={input.regular}
					history={input.history}
				/>
			</li>
		{/each}
	</ul>
</div>
