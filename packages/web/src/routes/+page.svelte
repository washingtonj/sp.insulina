<script lang="ts">
	import { onMount } from 'svelte';
	import AppNavbar from '$lib/components/app-navbar.svelte';
	import AppMap from '$lib/components/app-map.svelte';
	import UiPickupCard from '$lib/components/app-pickup-card.svelte';
	import AppFilters from '$lib/components/app-filters.svelte';
	import AppFilterBtn from '$lib/components/app-filter-btn.svelte';
	import data from '$lib/assets/data.json';
	import { userState, setLocation } from '$lib/stores/user.svelte';
	import { applyFiltersAndDistance } from '$lib/utils/filters';
	import { applySorters } from '$lib/utils/sorters';

	// PickupEntity type comes from core/entities/pickup, but for local data fallback, keep compatibility
	type Pickup = (typeof data)[number];

	let pickups = $state<Pickup[]>([]);

	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filter state
	let search = $state('');
	let insulinTypes = $state<string[]>([]);
	let openStatus = $state<string | null>(null);
	let focusedPickupId = $state('');
	let isFilterOpen = $state(false);

	let allInsulinTypes = $state<{ value: string; label: string }[]>([]);

	// Svelte 5 derived state
	let requestedInsulins = $derived(
		insulinTypes.length
			? Array.from(
					new Map(
						pickups
							.flatMap((pickup) => pickup.availability)
							.filter((a) => insulinTypes.includes(a.insulin.type))
							.map((a) => [a.insulin.code, a.insulin])
					).values()
				)
			: []
	);

	let is24hOnly = $derived(openStatus === '24h' || openStatus === 'both');
	let isWeekendOnly = $derived(openStatus === 'weekend' || openStatus === 'both');
	let userLocation = $derived(userState.location.data ?? null);

	let filteredPickups = $derived(
		applySorters(
			applyFiltersAndDistance(pickups, {
				requestedInsulins,
				searchQuery: search,
				is24hOnly,
				isWeekendOnly,
				userLocation,
				sortByDistance: true
			}),
			requestedInsulins
		)
	);

	// Populate allInsulinTypes after data is loaded
	function extractInsulinTypes(pickups: Pickup[]) {
		const set = new Set<string>();
		pickups.forEach((pickup) => {
			pickup.availability.forEach((a) => set.add(a.insulin.type));
		});
		return Array.from(set).map((type) => ({ value: type, label: type }));
	}

	$effect(() => {
		if (focusedPickupId) {
			const pickup = pickups.find((p) => p.id === focusedPickupId);
			if (pickup) {
				// Scroll to the focused pickup in the list
				const element = document.getElementById('pickup-' + pickup.id);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}
		} else {
			// Reset scroll if no pickup is focused
			const firstPickup = document.querySelector('.ui-pickup-card');
			if (firstPickup) {
				firstPickup.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	});

	onMount(async () => {
		setLocation(); // Get user location on page open
		try {
			const res = await fetch('https://sp-insulina-server.wwnjr.workers.dev');
			if (!res.ok) throw new Error('Erro ao buscar dados');
			pickups = await res.json();
			allInsulinTypes = extractInsulinTypes(pickups);
			// pickups = data;
			// allInsulinTypes = extractInsulinTypes(pickups);
		} catch (e) {
			error = 'Erro ao buscar dados dos pontos de retirada';
		} finally {
			loading = false;
		}
	});
</script>

<AppMap
	bind:focusedPickupId
	pickups={filteredPickups.map((pickup) => ({
		id: pickup.id,
		name: pickup.name,
		address: pickup.address.address,
		latitude: pickup.address.latitude,
		longitude: pickup.address.longitude
	}))}
/>
<div
	class="pointer-events-none absolute top-0 left-0 z-10 flex h-screen w-screen flex-col justify-between gap-4 overflow-hidden p-2 lg:justify-normal lg:p-4 xl:p-6 [&>*]:pointer-events-auto"
>
	<div class="flex items-center gap-2">
		<AppNavbar />
		{#if !isFilterOpen}
			<AppFilterBtn onClick={() => (isFilterOpen = !isFilterOpen)} />
		{/if}
	</div>

	<div class="flex h-[40%] flex-col gap-2 overflow-hidden lg:h-full lg:max-w-1/4">
		{#if isFilterOpen}
			<AppFilters
				bind:search
				bind:insulinTypes
				bind:openStatus
				bind:allInsulinTypes
				onClickOutside={() => (isFilterOpen = false)}
			/>
		{/if}
		<div
			class="scrollbar-none h-full overflow-y-scroll rounded-2xl border border-gray-300 bg-white shadow-xl"
		>
			<div class="p-4">
				{#if loading}
					<p class="text-sm text-gray-400">Carregando pontos de retirada...</p>
				{:else if error}
					<p class="text-sm text-red-500">{error}</p>
				{:else}
					<!-- // Pickup list -->
					<div class="flex flex-col gap-4">
						{#if filteredPickups.length === 0}
							<div class="py-8 text-center text-sm text-gray-400">Nenhum local encontrado.</div>
						{:else}
							{#each filteredPickups as pickup (pickup.id)}
								<UiPickupCard
									id={'pickup-' + pickup.id}
									name={pickup.name}
									address={pickup.address.address}
									businessHourTags={pickup.businessHourTags}
									availability={pickup.availability}
									selected={pickup.id === focusedPickupId}
									onClick={() => (focusedPickupId = pickup.id)}
									distance={pickup.address?.distance}
								/>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
