<script lang="ts">
	import AppPickupCard, { type PickupCardProps } from '$lib/components/app-pickup-card.svelte';
	import AppNavbar from '$lib/components/app-navbar.svelte';
	import AppPickupFilter from '$lib/components/app-pickup-filter.svelte';
	import UiAlert from '$lib/components/ui-alert.svelte';

	type AppViewProps = {
		pickups: PickupCardProps[];
	};

	let { pickups }: AppViewProps = $props();
</script>

<AppNavbar />
<AppPickupFilter />

<div class="flex flex-col gap-4 p-4">
	<UiAlert>
		Interface simplificada para visualização dos dados públicos do sistema <b>e-saude</b> da prefeitura
		de São Paulo. Facilitamos a localização de insumos na capital com informações geográficas adicionais.
	</UiAlert>

	<div class="flex flex-col gap-4">
		{#each pickups as pickup}
			<AppPickupCard
				pickupName={pickup.pickupName}
				pickupAddress={pickup.pickupAddress}
				businessHours={pickup.businessHours}
				data={pickup.data}
			/>
		{/each}
	</div>
</div>
