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
	import UiInput from './ui/UiInput.svelte';
	import LocationIcon from 'phosphor-svelte/lib/Gps';

	type Props = {
		data: AvailabilityEntity[];
		filtered: AvailabilityEntity[];
		selectedInsulinCodes?: string[];
	};

	let {
		data = [],
		filtered = $bindable([]),
		selectedInsulinCodes = $bindable([])
	}: Props = $props();

	let searchQuery = $state('');
	let orderByNearest = $state(false);
	let userLocation = $state<{ lat: number; lng: number } | null>(null);
	let locationError = $state('');

	let allInsulins = $derived(extractUniqueInsulins(data));
	let locationActive = $derived(orderByNearest && userLocation !== null);
	let locationLoading = $state(false);

	// Initialize filters when component is loaded
	$effect(() => {
		applyFilters();
	});

	function applyFilters() {
		// Start with all data
		let filteredResult = [...data];

		// 1. Apply insulin code filter if codes are selected
		if (selectedInsulinCodes.length > 0) {
			filteredResult = filterByInsulinCodes(filteredResult, selectedInsulinCodes);
		}

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
		searchQuery = '';
		orderByNearest = false;
		selectedInsulinCodes = [];
		filtered = data;
	}

	function handleLocationClick() {
		if (!navigator.geolocation) {
			locationError = 'Geolocalização não suportada neste navegador.';
			return;
		}

		// Toggle off if already active
		if (orderByNearest && userLocation !== null) {
			orderByNearest = false;
			applyFilters();
			return;
		}

		locationError = '';
		locationLoading = true;

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				userLocation = {
					lat: pos.coords.latitude,
					lng: pos.coords.longitude
				};
				orderByNearest = true;
				locationLoading = false;
				applyFilters();
			},
			() => {
				locationError = 'Não foi possível obter sua localização.';
				orderByNearest = false;
				locationLoading = false;
			}
		);
	}
</script>

<div class="filter-container rounded-lg border border-gray-200 bg-white p-4">
	<div class="flex flex-col space-y-4">
		<div>
			<label class="items-center gap-2 text-sm font-medium text-gray-700">
				Buscar por nome do posto ou endereço
				<UiInput
					onInput={applyFilters}
					placeholder="Digite para buscar..."
					bind:value={searchQuery}
				/>
			</label>
			{#if locationError}
				<div class="mt-1 text-xs text-red-600">{locationError}</div>
			{/if}
			{#if locationActive}
				<div class="mt-1 text-xs text-blue-600">Ordenando por proximidade da sua localização.</div>
			{/if}
		</div>

		<label class="block text-sm font-medium text-gray-700">
			Selecionar Insulinas
			<UiSelect
				items={allInsulins.map((insulin) => ({
					value: insulin.code,
					label: `${insulin.simpleName} (${insulin.type})`
				}))}
				type="multiple"
				bind:selected={selectedInsulinCodes}
				placeholder="Selecione as insulinas"
				onSelect={() => applyFilters()}
			/>
		</label>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div class="text-sm text-gray-500">
			Exibindo {filtered.length} de {data.length} locais
		</div>

		<div class="flex space-x-2">
			<UiButton variant={locationActive ? 'primary' : 'ghost'} onClick={handleLocationClick}>
				<div class="flex items-center">
					{#if locationLoading}
						<div
							class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
					{:else}
						<LocationIcon class="h-4 w-4" />
					{/if}
				</div>
			</UiButton>
			<UiButton variant="secondary" onClick={resetFilters}>Limpar Filtros</UiButton>
		</div>
	</div>
</div>
