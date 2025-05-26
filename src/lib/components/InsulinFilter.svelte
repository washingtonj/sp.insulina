<script lang="ts">
	import type { AvailabilityEntity } from '../../core/entities/availability';
	import { extractUniqueInsulins } from '../utils/insulinFilters';
	import UiSelect from './ui/UiSelect.svelte';

	type Props = {
		data: AvailabilityEntity[];
		filtered: AvailabilityEntity[];
	};

	let { data = [], filtered = $bindable([]) }: Props = $props();

	let searchQuery = $state('');
	let orderByNearest = $state(false);
	let userLocation = $state<{ lat: number; lng: number } | null>(null);
	let locationError = $state('');

	const allInsulins = $derived(extractUniqueInsulins(data));

	const insulinOptions = $derived(
		allInsulins.map((insulin) => ({
			value: insulin.code,
			label: `${insulin.simpleName} (${insulin.type})`
		}))
	);

	// Haversine formula to calculate distance between two lat/lng points in km
	function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
		const toRad = (v: number) => (v * Math.PI) / 180;
		const R = 6371;
		const dLat = toRad(lat2 - lat1);
		const dLng = toRad(lng2 - lng1);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	let selectedInsulinCodes = $state<string[]>([]);
	export { selectedInsulinCodes };

	// Auto-select all insulins when data changes, mas só se nada estiver selecionado (não sobrescreve escolha do usuário)
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
		let filteredResult = data;

		// 1. Filtrar locais que tenham TODAS as insulinas selecionadas, cada uma com quantidade > 0
		if (selectedInsulinCodes.length > 0) {
			filteredResult = filteredResult.filter((entity) => {
				// Para cada insulina selecionada, deve haver pelo menos uma quantity > 0 desse código
				return selectedInsulinCodes.every((code) =>
					entity.quantity.some((q) => q.insulin.code === code && q.quantity > 0)
				);
			});
		} else {
			// Se nada selecionado, lista vazia
			filtered = [];
			return;
		}

		// 2. Filtro por busca (nome/endereço)
		const query = searchQuery.trim().toLowerCase();
		if (query) {
			filteredResult = filteredResult.filter((entity) => {
				const name = entity.pickup?.placeName?.toLowerCase() || '';
				const address = entity.pickup?.address?.address?.toLowerCase() || '';
				return name.includes(query) || address.includes(query);
			});
		}

		// 3. Ordenação inteligente
		if (orderByNearest && userLocation !== null) {
			filteredResult = filteredResult
				.map((entity) => {
					const lat = entity.pickup?.address?.latitude;
					const lng = entity.pickup?.address?.longitude;
					const distance =
						typeof lat === 'number' && typeof lng === 'number' && userLocation
							? getDistanceKm(userLocation.lat, userLocation.lng, lat, lng)
							: Number.POSITIVE_INFINITY;
					// Para as insulinas selecionadas, pega o menor level e soma total
					const relevant = entity.quantity.filter(
						(q) => selectedInsulinCodes.includes(q.insulin.code) && q.quantity > 0
					);
					const minLevel = relevant.length > 0 ? Math.min(...relevant.map((q) => q.level)) : 0;
					const totalQty = relevant.reduce((sum, q) => sum + q.quantity, 0);
					return {
						...entity,
						distanceKm: distance !== Number.POSITIVE_INFINITY ? distance : null,
						minLevel,
						totalQty,
						quantity: entity.quantity // mantém o original para o card
					};
				})
				.filter((item) => item.distanceKm !== null)
				// Ordena por distância, depois maior nível mínimo, depois maior quantidade total
				.sort((a, b) =>
					a.distanceKm !== b.distanceKm
						? a.distanceKm - b.distanceKm
						: b.minLevel !== a.minLevel
							? b.minLevel - a.minLevel
							: b.totalQty - a.totalQty
				);
		} else {
			// Ordena por maior nível mínimo das insulinas selecionadas, depois maior quantidade total
			filteredResult = filteredResult
				.map((entity) => {
					const relevant = entity.quantity.filter(
						(q) => selectedInsulinCodes.includes(q.insulin.code) && q.quantity > 0
					);
					const minLevel = relevant.length > 0 ? Math.min(...relevant.map((q) => q.level)) : 0;
					const totalQty = relevant.reduce((sum, q) => sum + q.quantity, 0);
					return {
						...entity,
						minLevel,
						totalQty,
						distanceKm: null,
						quantity: entity.quantity // mantém o original para o card
					};
				})
				.sort((a, b) =>
					b.minLevel !== a.minLevel ? b.minLevel - a.minLevel : b.totalQty - a.totalQty
				);
		}

		filtered = filteredResult;
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
				class="mb-1 block flex items-center gap-2 text-sm font-medium text-gray-700"
			>
				Buscar por nome do posto ou endereço
				<button
					type="button"
					class="ml-2 rounded-full border border-gray-300 bg-white p-1 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					title="Ordenar por proximidade"
					onclick={handleLocationClick}
					aria-pressed={orderByNearest}
					aria-label="Ordenar por proximidade"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 {orderByNearest ? 'text-blue-600' : 'text-gray-500'}"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<circle cx="12" cy="12" r="10" stroke-width="2" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3" />
					</svg>
				</button>
			</label>
			<div class="relative">
				<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
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
			{#if orderByNearest && userLocation}
				<div class="mt-1 text-xs text-blue-600">Ordenando por proximidade da sua localização.</div>
			{/if}
		</div>

		<!-- Multi-select Insulin Filter using UiSelect -->
		<div class="filter-group">
			<label class="mb-1 block text-sm font-medium text-gray-700">
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

		<button
			onclick={resetFilters}
			class="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
		>
			Limpar Filtros
		</button>
	</div>
</div>
