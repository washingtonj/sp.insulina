<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import type * as Leaflet from 'leaflet';
	import { totalUnits, type Place } from '$lib/places';
	import { STOCK_LEVEL_COLOR, stockLevel, type StockSelection } from '$lib/stock-level';

	type Props = {
		places: Place[];
		selectedId?: string | null;
		theme?: 'dark' | 'light';
		selection?: StockSelection;
		paddingLeft?: number;
		onselect?: (id: string) => void;
	};

	let {
		places,
		selectedId = null,
		theme = 'dark',
		selection = {},
		paddingLeft = 0,
		onselect = () => {}
	}: Props = $props();

	const SELECT_RING = { dark: '#f4f4f5', light: '#1d1d1f' };

	const SAO_PAULO: Leaflet.LatLngTuple = [-23.5505, -46.6333];

	let container = $state<HTMLDivElement | null>(null);
	let leaflet = $state.raw<typeof import('leaflet') | null>(null);
	let map = $state.raw<Leaflet.Map | null>(null);
	let markers = $state.raw(new Map<string, Leaflet.CircleMarker>());
	let fitted = false;

	$effect(() => {
		const node = container;
		if (!node) return;

		let cancelled = false;
		let instance: Leaflet.Map | null = null;
		let observer: ResizeObserver | null = null;

		void import('leaflet').then((L) => {
			if (cancelled) return;

			instance = L.map(node, { zoomControl: false }).setView(SAO_PAULO, 11);
			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap',
				maxZoom: 19
			}).addTo(instance);
			instance.attributionControl.setPrefix(false);
			observer = new ResizeObserver(() => instance?.invalidateSize());
			observer.observe(node);

			leaflet = L;
			map = instance;
		});

		return () => {
			cancelled = true;
			observer?.disconnect();
			instance?.remove();
			map = null;
			leaflet = null;
			fitted = false;
		};
	});

	$effect(() => {
		const L = leaflet;
		const instance = map;
		if (!L || !instance) return;

		const group = L.layerGroup().addTo(instance);
		const created = new Map<string, Leaflet.CircleMarker>();

		for (const place of places) {
			const level = stockLevel(place, selection);

			const marker = L.circleMarker([place.address.latitude, place.address.longitude], {
				radius: level === 0 ? 4 : 5.5,
				color: STOCK_LEVEL_COLOR[level],
				weight: 2,
				fillColor: STOCK_LEVEL_COLOR[level],
				fillOpacity: level === 0 ? 0 : 1
			})
				.on('click', () => onselect(place.id))
				.addTo(group);

			created.set(place.id, marker);
		}

		markers = created;

		if (!fitted && places.length > 0) {
			instance.fitBounds(
				L.latLngBounds(
					places.map((place) => [place.address.latitude, place.address.longitude])
				).pad(0.1),
				{ paddingTopLeft: [paddingLeft, 0] }
			);
			fitted = true;
		}

		return () => {
			group.remove();
			markers = new Map();
		};
	});

	$effect(() => {
		const ring = SELECT_RING[theme];

		for (const place of places) {
			const selected = place.id === selectedId;
			const marker = markers.get(place.id);
			if (!marker) continue;

			const level = stockLevel(place, selection);
			const color = STOCK_LEVEL_COLOR[level];

			marker.setStyle({
				radius: selected ? 8 : level === 0 ? 4 : 5.5,
				weight: selected ? 3.5 : 2,
				color: selected ? ring : color,
				fillColor: color,
				fillOpacity: level === 0 ? 0 : 1
			});

			marker.unbindTooltip();
			if (selected) {
				marker
					.bindTooltip(`${totalUnits(place)} un.`, {
						permanent: true,
						direction: 'bottom',
						offset: [0, 6],
						className: 'sp-pin-label'
					})
					.openTooltip();
			}
		}
	});

	$effect(() => {
		const instance = map;
		const id = selectedId;
		if (!instance || !id) return;

		const marker = markers.get(id);
		if (!marker) return;

		const zoom = Math.max(instance.getZoom(), 13);
		const point = instance.project(marker.getLatLng(), zoom).subtract([paddingLeft / 2, 0]);

		instance.flyTo(instance.unproject(point, zoom), zoom, { duration: 0.6 });
	});
</script>

<div bind:this={container} class="sp-map isolate h-full w-full"></div>

<style>
	:global(.sp-map .leaflet-tile-pane) {
		filter: var(--map-filter);
	}

	:global(.sp-pin-label) {
		background: var(--color-surface);
		border: none;
		border-radius: var(--radius-pill);
		box-shadow: none;
		color: var(--color-ink);
		font-size: 12px;
		font-weight: 600;
		padding: 2px 8px;
	}

	:global(.sp-pin-label::before) {
		display: none;
	}

	:global(.leaflet-container) {
		background: var(--map-bg);
		font-family: inherit;
	}

	:global(.leaflet-control-attribution) {
		background: transparent;
		color: var(--color-faint);
		font-size: 10px;
	}

	:global(.leaflet-control-attribution a) {
		color: var(--color-faint);
	}

	/* no mobile o sheet cobre o rodapé: crédito sobe para ficar visível */
	@media (max-width: 767px) {
		:global(.leaflet-bottom.leaflet-right) {
			bottom: calc(32dvh + 3.25rem);
		}
	}
</style>
