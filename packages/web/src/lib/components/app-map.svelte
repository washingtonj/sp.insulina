<script lang="ts">
	import type * as Leaflet from 'leaflet';
	import { onMount } from 'svelte';

	type Props = {
		focusedPickupId?: string;
		sidebarWidth?: number;
		pickups: {
			id: string;
			name: string;
			latitude: number;
			longitude: number;
			address: string;
		}[];
	};

	let { pickups, focusedPickupId = $bindable(), sidebarWidth }: Props = $props();
	let mapElement = $state<HTMLDivElement | null>(null);
	let map = $state<Leaflet.Map | null>(null);
	let markers = $state<Leaflet.Marker[]>([]);
	let markersById = $state<Record<string, any>>({});

	let isPickupsUpdated = $state(false);

	$effect(() => {
		if (pickups.length > 0) {
			isPickupsUpdated = true;
		}
	});

	$effect(() => {
		if (focusedPickupId) {
			if (map && markersById[focusedPickupId]) {
				const marker = markersById[focusedPickupId];
				const latlng = marker.getLatLng();
				map.setView(latlng, 16, { animate: true });
				marker.openPopup();

				if (sidebarWidth) {
					// Calculate the offset to center the marker in the visible map area
					const mapSize = map.getSize();
					const point = map.project(latlng, map.getZoom());
					const offsetX = sidebarWidth / 2 - mapSize.x / 2;
					const centerPoint = point.subtract([offsetX, 0]);
					const centerLatLng = map.unproject(centerPoint, map.getZoom());

					setTimeout(() => {
						map!.panTo(centerLatLng, { animate: true });
					}, 400);
				}
			}
		}
	});

	onMount(() => {
		if (window?.L && mapElement) {
			const L: typeof import('leaflet') = window.L;

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

	$effect(() => {
		if (map && isPickupsUpdated) {
			isPickupsUpdated = false;
			markers.forEach((m) => map?.removeLayer(m));
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

			// Create new markers array and object
			const newMarkers: Leaflet.Marker[] = [];
			const newMarkersById: Record<string, any> = {};

			pickups.forEach((pickup) => {
				const marker = L.marker([pickup.latitude, pickup.longitude], {
					icon: blackIcon
				}).addTo(map!);
				marker.bindPopup(`<strong>${pickup.name}</strong><br>${pickup.address}`);
				marker.on('click', () => {
					focusedPickupId = pickup.id;
				});
				newMarkers.push(marker);
				newMarkersById[pickup.id] = marker;
			});

			markers = newMarkers;
			markersById = newMarkersById;
		}
	});
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

<style>
	/* Make map container take up 100% of the viewport */
	#map {
		height: 100dvh;
		width: 100%;
		position: relative;
		z-index: 0;
	}
</style>
