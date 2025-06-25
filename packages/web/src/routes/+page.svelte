<script lang="ts">
	import { onMount } from 'svelte';
	import AppNavbar from '$lib/components/app-navbar.svelte';
	import AppMap from '$lib/components/app-map.svelte';
	import UiPickupCard from '$lib/components/app-pickup-card.svelte';
	import UiInput from '$lib/components/ui-input.svelte';
	import UiSelect from '$lib/components/ui-select.svelte';
	import data from '$lib/assets/data.json';

	type Pickup = {
		id: string;
		name: string;
		address: { address: string; latitude: number; longitude: number };
		businessHourTags: string[];
		is24HoursOpen: boolean;
		isWeekendOpen: boolean;
		availability: {
			insulin: {
				id: number;
				code: string;
				name: string;
				simpleName: string;
				type: string;
				variant: string;
			};
			quantity: number;
			level: number;
		}[];
	};

	let pickups = $state<Pickup[]>([]);

	let focusedPickupId = $state('');
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filter state
	let search = $state('');
	let insulinTypes = $state<string[]>([]);
	let openStatus = $state<string | null>(null);

	// All insulin types for select
	let allInsulinTypes = $state<{ value: string; label: string }[]>([]);

	let filteredPickups = $derived(
		pickups.filter((pickup) => {
			const searchLower = search.trim().toLowerCase();
			const matchesSearch =
				!searchLower ||
				pickup.name.toLowerCase().includes(searchLower) ||
				pickup.address.address.toLowerCase().includes(searchLower);

			const matchesType =
				insulinTypes.length === 0 ||
				insulinTypes.some((type) => {
					const total = pickup.availability
						.filter((a) => a.insulin.type === type)
						.reduce((sum, a) => sum + a.quantity, 0);
					return total > 5;
				});

			let matchesOpenStatus = true;
			if (openStatus === '24h') {
				matchesOpenStatus = pickup.is24HoursOpen;
			} else if (openStatus === 'weekend') {
				matchesOpenStatus = pickup.isWeekendOpen;
			} else if (openStatus === 'both') {
				matchesOpenStatus = pickup.is24HoursOpen && pickup.isWeekendOpen;
			}

			return matchesSearch && matchesType && matchesOpenStatus;
		})
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
		// Fetch pickup data
		try {
			// const res = await fetch('https://sp-insulina-server.wwnjr.workers.dev');
			// if (!res.ok) throw new Error('Erro ao buscar dados');
			// pickups = await res.json();
			// allInsulinTypes = extractInsulinTypes(pickups);
			pickups = data;
			allInsulinTypes = extractInsulinTypes(pickups);
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
	class="pointer-events-none absolute top-0 left-0 z-10 flex h-screen w-screen flex-col gap-4 overflow-hidden p-6 [&>*]:pointer-events-auto"
>
	<AppNavbar />

	<div
		class="scrollbar-none h-full max-w-1/4 overflow-y-scroll rounded-2xl border border-gray-300 bg-white shadow-xl"
	>
		<div class="p-4">
			{#if loading}
				<p class="text-sm text-gray-400">Carregando pontos de retirada...</p>
			{:else if error}
				<p class="text-sm text-red-500">{error}</p>
			{:else}
				<!-- Filter UI -->
				<div class="mb-4 flex flex-col gap-3">
					<div>
						<UiInput placeholder="Buscar por nome ou endereço" bind:value={search} />
					</div>
					<div>
						<UiSelect
							items={allInsulinTypes}
							type="multiple"
							bind:selected={insulinTypes}
							placeholder="Tipo de insulina"
						/>
					</div>
					<div>
						<UiSelect
							items={[
								{ value: null, label: 'Todos' },
								{ value: '24h', label: '24h' },
								{ value: 'weekend', label: 'Fim de semana' },
								{ value: 'both', label: '24h e Fim de semana' }
							]}
							type="single"
							bind:selected={openStatus}
							placeholder="Aberto"
						/>
					</div>
				</div>
				<!-- // Pickup list -->
				<div class="flex flex-col gap-4">
					{#if pickups.length === 0}
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
							/>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
