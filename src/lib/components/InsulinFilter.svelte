<script lang="ts">
	import type { AvailabilityEntity } from '$core/entities/availability';
	import {
		extractUniqueInsulins,
		filterByInsulinCodes,
		filterBySearchQuery,
		addSortingMetrics
	} from '$lib/utils/insulinFilters';
	import { sortIntelligent } from '$lib/utils/insulinSorters';
	import { addDistanceToAvailability } from '$lib/utils/locationUtils';
	import UiSelect from '$lib/components/ui/UiSelect.svelte';
	import UiButton from './ui/UiButton.svelte';
	import SearchIcon from 'phosphor-svelte/lib/MagnifyingGlass';
	import LocationIcon from 'phosphor-svelte/lib/Gps';

	type Props = {
		data: AvailabilityEntity[];
		filtered: AvailabilityEntity[];
	};

	let { data = [], filtered = $bindable([]) }: Props = $props();

	let searchQuery = $state('');
	let orderByNearest = $state(false);
	let userLocation = $state<{ lat: number; lng: number } | null>(null);
	let locationError = $state('');
	let selectedInsulinCodes = $state<string[]>([]);

	let allInsulins = $derived(extractUniqueInsulins(data));
	let locationActive = $derived(orderByNearest && userLocation !== null);
	let insulinOptions = $derived(
		allInsulins.map((insulin) => ({
			value: insulin.code,
			label: `${insulin.simpleName} (${insulin.type})`
		}))
	);

	$effect(() => {
		if (allInsulins.length > 0 && selectedInsulinCodes.length === 0) {
			selectedInsulinCodes = allInsulins.map((insulin) => insulin.code);
		}
	});

	$effect(() => {
		if (data && data.length > 0) {
			applyFilters();
		}
	});

	function applyFilters() {
		if (selectedInsulinCodes.length === 0) {
			filtered = [];
			return;
		}

		// 1. Apply insulin code filter (requires all selected insulins)
		let filteredResult = filterByInsulinCodes(data, selectedInsulinCodes);

		// 2. Apply search query filter
		if (searchQuery) {
			filteredResult = filterBySearchQuery(filteredResult, searchQuery);
		}

		// 3. Add metrics for sorting
		let enhancedData = addSortingMetrics(filteredResult, selectedInsulinCodes);

		// 4. Add distance data if needed
		if (orderByNearest && userLocation !== null) {
			enhancedData = addDistanceToAvailability(enhancedData, userLocation);
		}

		// 5. Apply intelligent sorting
		filtered = sortIntelligent(enhancedData, orderByNearest && userLocation !== null);
	}

	function resetFilters() {
		selectedInsulinCodes = allInsulins.map((insulin) => insulin.code);
		searchQuery = '';
		orderByNearest = false;
		locationError = '';
		userLocation = null;
		applyFilters();
	}

	function handleLocationClick() {
		if (orderByNearest && userLocation !== null) {
			// Toggle off if already active
			orderByNearest = false;
			applyFilters();
			return;
		}

		if (!navigator.geolocation) {
			locationError = 'Geolocalização não suportada neste navegador.';
			return;
		}
		locationError = '';
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				userLocation = {
					lat: pos.coords.latitude,
					lng: pos.coords.longitude
				};
				orderByNearest = true;
				applyFilters();
			},
			() => {
				locationError = 'Não foi possível obter sua localização.';
				orderByNearest = false;
			}
		);
	}
</script>

<div class="filter-container mb-4 rounded-lg border border-gray-200 bg-white p-4">
	<h2 class="mb-3 text-xl font-semibold">Filtros</h2>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- Search By Pickup or Address + Location Button -->
		<div class="filter-group">
			<label
				for="search-query"
				class="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700"
			>
				Buscar por nome do posto ou endereço
			</label>
			<div class="relative">
				<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
					<SearchIcon class="h-5 w-5" />
				</span>
				<input
					type="text"
					id="search-query"
					bind:value={searchQuery}
					oninput={applyFilters}
					placeholder="Digite para buscar..."
					class="w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>
			{#if locationError}
				<div class="mt-1 text-xs text-red-600">{locationError}</div>
			{/if}
			{#if locationActive}
				<div class="mt-1 text-xs text-blue-600">Ordenando por proximidade da sua localização.</div>
			{/if}
		</div>

		<!-- Multi-select Insulin Filter using UiSelect -->
		<div class="filter-group">
			<label class="mb-1 block text-sm font-medium text-gray-700">
				Selecionar Insulinas
				<UiSelect
					items={insulinOptions}
					type="multiple"
					bind:selected={selectedInsulinCodes}
					placeholder="Selecione as insulinas"
					onSelect={() => applyFilters()}
				/>
			</label>
			{#if selectedInsulinCodes.length === 0}
				<div class="mt-1 text-xs text-gray-500">
					Selecione pelo menos uma insulina para ver os locais disponíveis.
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div class="text-sm text-gray-500">
			Exibindo {filtered.length} de {data.length} locais
		</div>

		<div class="flex space-x-2">
			<UiButton variant={locationActive ? 'primary' : 'ghost'} onClick={handleLocationClick}>
				<LocationIcon class="h-4 w-4" />
			</UiButton>
			<UiButton variant="secondary" onClick={resetFilters}>Limpar Filtros</UiButton>
		</div>
	</div>
</div>
