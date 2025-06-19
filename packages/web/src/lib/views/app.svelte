<script lang="ts" module>
	import AppNavbar from '$lib/components/app-navbar.svelte';
	import AppPickupFilter, {
		type AppPickupFilterProps
	} from '$lib/components/app-pickup-filter.svelte';
	import AppPickupCard, { type AppPickupCardProps } from '$lib/components/app-pickup-card.svelte';
	import UiAlert from '$lib/components/ui-alert.svelte';

	export type AppViewState = {
		pickups: AppPickupCardProps[];
		filter: AppPickupFilterProps;
		isLoading: boolean;
	};

	type AppViewActions = {
		action: 'filter';
		payload: Omit<AppPickupFilterProps, 'insulinTypes'>;
	};

	type AppViewProps = {
		data: AppViewState;
		dispatch: (action: AppViewActions) => void;
	};
</script>

<script lang="ts">
	let { data, dispatch }: AppViewProps = $props();
	let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

	let state = $state(data);

	$effect(() => {
		const payload = {
			searchQuery: state.filter.searchQuery,
			businessHours: state.filter.businessHours,
			selectedInsulinTypes: state.filter.selectedInsulinTypes
		};

		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		debounceTimeout = setTimeout(() => {
			dispatch({ action: 'filter', payload });
		}, 500);
	});
</script>

<AppNavbar />
<AppPickupFilter
	bind:searchQuery={state.filter.searchQuery}
	bind:businessHours={state.filter.businessHours}
	bind:selectedInsulinTypes={state.filter.selectedInsulinTypes}
	insulinTypes={state.filter.insulinTypes}
/>

<div class="flex flex-col gap-4 p-4">
	<UiAlert>
		Interface simplificada para visualização dos dados públicos do sistema <b>e-saude</b> da prefeitura
		de São Paulo. Facilitamos a localização de insumos na capital com informações geográficas adicionais.
	</UiAlert>

	<div class="flex flex-col gap-4">
		{#each state.pickups as pickup}
			<AppPickupCard
				pickupName={pickup.pickupName}
				pickupAddress={pickup.pickupAddress}
				businessHours={pickup.businessHours}
				data={pickup.data}
			/>
		{/each}
	</div>
</div>
