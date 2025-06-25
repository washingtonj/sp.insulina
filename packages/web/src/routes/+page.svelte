<script lang="ts">
	import { onMount } from 'svelte';
	import type { Map as LeafletMap } from 'leaflet';
	import AppNavbar from '$lib/components/app-navbar.svelte';
	import UiPickupList from '$lib/components/ui-pickup-list.svelte';
	import UiInput from '$lib/components/ui-input.svelte';
	import UiSelect from '$lib/components/ui-select.svelte';

	// Declare window.L for TypeScript
	declare global {
		interface Window {
			L: typeof import('leaflet');
		}
	}

	let mapElement: HTMLDivElement;
	let map: LeafletMap | null = null;

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

	let pickups: Pickup[] = [];
	let filteredPickups: Pickup[] = [];
	let loading = true;
	let error: string | null = null;

	// Filter state
	let search = '';
	let insulinTypes: string[] = [];
	let openStatus: string | null = null;

	// All insulin types for select
	let allInsulinTypes: { value: string; label: string }[] = [];

	// Update filteredPickups whenever filters or pickups change
	$: filteredPickups = pickups.filter((pickup) => {
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
	});

	// Populate allInsulinTypes after data is loaded
	function extractInsulinTypes(pickups: Pickup[]) {
		const set = new Set<string>();
		pickups.forEach((pickup) => {
			pickup.availability.forEach((a) => set.add(a.insulin.type));
		});
		return Array.from(set).map((type) => ({ value: type, label: type }));
	}

	let markers: any[] = [];
	let markersById: Record<string, any> = {};

	onMount(async () => {
		// Fetch pickup data
		try {
			const res = await fetch('https://sp-insulina-server.wwnjr.workers.dev');
			if (!res.ok) throw new Error('Erro ao buscar dados');
			pickups = await res.json();
			allInsulinTypes = extractInsulinTypes(pickups);
		} catch (e) {
			error = 'Erro ao buscar dados dos pontos de retirada';
		} finally {
			loading = false;
		}

		// Initialize the map once Leaflet is loaded
		if (typeof window !== 'undefined' && window.L) {
			const L = window.L;

			map = L.map(mapElement, {
				zoomControl: false // Disable default zoom control
			}).setView([-23.55052, -46.633308], 11);

			// Add grayscale tile layer
			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 19
			}).addTo(map);

			// Add zoom control to the right side
			L.control
				.zoom({
					position: 'topright'
				})
				.addTo(map);

			const resizeObserver = new ResizeObserver(() => {
				if (map) {
					map.invalidateSize();
				}
			});
			resizeObserver.observe(mapElement);

			return () => {
				resizeObserver.disconnect();
				map?.remove();
				map = null;
			};
		}
	});

	// Keep map markers in sync with filteredPickups
	$: if (map && filteredPickups) {
		// Remove old markers
		markers.forEach((m) => map.removeLayer(m));
		markers = [];
		markersById = {};

		const L = window.L;
		const blackIcon = L.icon({
			iconUrl:
				'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',
			shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});

		filteredPickups.forEach((pickup) => {
			if (
				pickup?.address &&
				typeof pickup.address.latitude === 'number' &&
				typeof pickup.address.longitude === 'number'
			) {
				const marker = L.marker([pickup.address.latitude, pickup.address.longitude], {
					icon: blackIcon
				}).addTo(map);
				marker.bindPopup(`<strong>${pickup.name}</strong><br>${pickup.address.address}`);
				marker.on('click', () => {
					const el = document.getElementById(`pickup-${pickup.id}`);
					if (el) {
						el.scrollIntoView({ behavior: 'smooth', block: 'center' });
						el.classList.add('ring-2', 'ring-black');
						setTimeout(() => el.classList.remove('ring-2', 'ring-black'), 1200);
					}
				});
				markers.push(marker);
				markersById[pickup.id] = marker;
			}
		});
	}
	function focusMarker(pickupId: string) {
		if (map && markersById[pickupId]) {
			const marker = markersById[pickupId];
			const latlng = marker.getLatLng();
			map.setView(latlng, 16, { animate: true });
			marker.openPopup();

			// Calculate sidebar width in pixels
			const sidebar = document.querySelector('.max-w-1/4, .sidebar-selector-if-different');
			const sidebarWidth = sidebar ? sidebar.getBoundingClientRect().width : 0;
			const mapSize = map.getSize();

			// Calculate the offset to center the marker in the visible map area
			const point = map.project(latlng, map.getZoom());
			const offsetX = sidebarWidth / 2 - mapSize.x / 2;
			const centerPoint = point.subtract([offsetX, 0]);
			const centerLatLng = map.unproject(centerPoint, map.getZoom());

			setTimeout(() => {
				map.panTo(centerLatLng, { animate: true });
			}, 400);
		}
	}
</script>

<svelte:head>
	<!-- Leaflet CSS -->
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
		crossorigin=""
	/>

	<!-- Leaflet JavaScript -->
	<script
		src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
		integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
		crossorigin=""
	></script>
</svelte:head>

<div bind:this={mapElement} id="map"></div>

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
				<UiPickupList pickups={filteredPickups} on:pickupClick={(e) => focusMarker(e.detail)} />
			{/if}
		</div>
	</div>
</div>

<style>
	/* Make map container take up 100% of the viewport */
	#map {
		height: 100vh;
		width: 100%;
		position: relative;
		z-index: 0;
	}
</style>
