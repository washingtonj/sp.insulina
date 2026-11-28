<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { ChartLine, CircleNotch, Moon, NavigationArrow, Sun, X } from 'phosphor-svelte';
	import AppMap from '$lib/components/app-map.svelte';
	import AppSearch from '$lib/components/app-search.svelte';
	import AvailabilityCharts from '$lib/components/availability-charts.svelte';
	import FiltersPopover from '$lib/components/filters-popover.svelte';
	import FiltersSheet from '$lib/components/filters-sheet.svelte';
	import MapLegend from '$lib/components/map-legend.svelte';
	import PlaceList from '$lib/components/place-list.svelte';
	import ScrollFade from '$lib/components/scroll-fade.svelte';
	import { motion } from '$lib/motion';
	import { activeFilterCount } from '$lib/places';
	import { PlacesState } from '$lib/places-state.svelte';
	import { applyTheme, readTheme, type Theme } from '$lib/theme';
	import { bestDayLabel } from '$lib/best-day';

	const places = new PlacesState();
	let isMobile = $state(false);
	let expanded = $state(false);
	let showCharts = $state(false);
	let chartsPickupId = $state<string | undefined>(undefined);
	let chartsClose = $state<HTMLButtonElement | null>(null);
	let chartsOpener: HTMLElement | null = null;
	let dragStartY: number | null = null;
	let suppressHandleClick = false;
	let theme = $state<Theme>('dark');

	let filterCount = $derived(activeFilterCount(places.filters));

	onMount(() => {
		theme = readTheme();
		places.load();

		const query = window.matchMedia('(max-width: 767px)');
		const update = () => (isMobile = query.matches);
		update();
		query.addEventListener('change', update);

		return () => query.removeEventListener('change', update);
	});

	function handleDragStart(event: PointerEvent & { currentTarget: HTMLButtonElement }) {
		dragStartY = event.clientY;
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function handleDragEnd(event: PointerEvent) {
		if (dragStartY === null) return;

		const delta = event.clientY - dragStartY;
		dragStartY = null;
		suppressHandleClick = true;

		if (Math.abs(delta) < 24) {
			expanded = !expanded;
			return;
		}

		expanded = delta < 0;
	}

	function handleToggle() {
		if (suppressHandleClick) {
			suppressHandleClick = false;
			return;
		}

		expanded = !expanded;
	}

	function select(id: string) {
		places.selectedId = id;
		showCharts = false;
	}

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		applyTheme(theme);
	}

	function openCharts(pickupId?: string) {
		chartsOpener =
			typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		chartsPickupId = pickupId;
		showCharts = true;
	}

	function closeCharts() {
		showCharts = false;
		chartsOpener?.focus();
	}

	$effect(() => {
		if (showCharts) chartsClose?.focus();
	});
</script>

<div class="flex h-dvh flex-col">
	<div class="flex h-11 shrink-0 items-center px-4 pt-[env(safe-area-inset-top)] md:px-3">
		<span class="text-title-3 text-ink font-extrabold">sp.insulina</span>

		<div class="ml-auto flex shrink-0 items-center gap-1">
			<button
				type="button"
				class="text-ink hover:text-muted press flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center transition-colors"
				aria-label="Histórico de disponibilidade"
				aria-pressed={showCharts}
				title="Histórico"
				onclick={() => (showCharts ? closeCharts() : openCharts())}
			>
				<ChartLine size={18} weight={showCharts ? 'bold' : 'regular'} />
			</button>

			<button
				type="button"
				class="text-ink hover:text-muted press flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center transition-colors"
				aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
				title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
				onclick={toggleTheme}
			>
				{#if theme === 'dark'}
					<Sun size={18} />
				{:else}
					<Moon size={18} />
				{/if}
			</button>
		</div>
	</div>

	<div class="relative min-h-0 flex-1 p-0 md:px-3 md:pt-2 md:pb-3">
		<div class="rounded-t-sheet h-full w-full overflow-hidden md:rounded-[28px]">
			<AppMap
				places={places.matching}
				selectedId={places.selectedId}
				{theme}
				selection={places.filters}
				paddingLeft={isMobile ? 0 : 500}
				onselect={(id) => select(id)}
			/>
		</div>

		<div class="pointer-events-none absolute inset-0 flex flex-col gap-2 px-0 pt-0 pb-0 md:p-4">
			<div
				class={[
					'pointer-events-none absolute right-2 left-2 flex justify-end md:right-4 md:bottom-4 md:left-auto',
					expanded ? 'hidden md:flex' : 'bottom-[calc(32dvh+0.5rem)] flex'
				]}
			>
				<MapLegend filtered={filterCount > 0} />
			</div>

			{#if places.locationError}
				<p
					role="alert"
					class="bg-surface text-ink shadow-float text-footnote pointer-events-auto w-fit rounded-full px-4 py-2"
				>
					{places.locationError}
				</p>
			{/if}

			{#if filterCount > 0}
				<button
					type="button"
					class="bg-surface/85 text-ink shadow-float text-footnote pointer-events-auto flex h-11 w-fit cursor-pointer items-center rounded-full px-4 font-medium backdrop-blur-xl"
					onclick={() => places.clearFilters()}
				>
					Limpar filtros
				</button>
			{/if}

			<div class="flex min-h-0 flex-1 items-end gap-2 md:items-start">
				<aside
					class={[
						'rounded-t-sheet shadow-float md:rounded-card bg-surface border-line pointer-events-auto flex w-full flex-col overflow-hidden border transition-[height] duration-[220ms] ease-[cubic-bezier(0.2,0,0,1)] md:h-full md:w-[30rem]',
						expanded ? 'h-[78dvh]' : 'h-[32dvh]'
					]}
				>
					<button
						type="button"
						class="flex w-full shrink-0 cursor-grab touch-none justify-center py-2 md:hidden"
						aria-expanded={expanded}
						aria-label={expanded ? 'Recolher lista' : 'Expandir lista'}
						onpointerdown={handleDragStart}
						onpointerup={handleDragEnd}
						onclick={handleToggle}
					>
						<span class="bg-faint/40 h-1 w-10 rounded-full"></span>
					</button>

					<div class="flex shrink-0 items-center px-2 pt-2 pb-1">
						<AppSearch bind:value={places.search}>
							{#snippet trailing()}
								<div class="flex items-center gap-1">
									{#if isMobile}
										<FiltersSheet
											compact
											filters={places.filters}
											hasLocation={places.origin !== null}
											onapply={(filters) => places.applyFilters(filters)}
										/>
									{:else}
										<FiltersPopover
											compact
											filters={places.filters}
											hasLocation={places.origin !== null}
											onapply={(filters) => places.applyFilters(filters)}
										/>
									{/if}
									<button
										type="button"
										class="rounded-pill text-ink hover:text-muted press flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center transition-colors disabled:opacity-60"
										disabled={places.isLocating}
										aria-label="Localizar"
										title="Localizar"
										onclick={() => places.locate()}
									>
										{#if places.isLocating}
											<CircleNotch class="animate-spin" size={16} />
										{:else}
											<NavigationArrow size={16} weight={places.origin ? 'fill' : 'regular'} />
										{/if}
									</button>
								</div>
							{/snippet}
						</AppSearch>
					</div>

					<ScrollFade class="pb-[env(safe-area-inset-bottom)]">
						<PlaceList
							places={places.results}
							isLoading={places.isLoading}
							error={places.loadError}
							selectedId={places.selectedId}
							onselect={(id) => select(id)}
							onhistory={(id) => openCharts(id)}
							onretry={() => places.load()}
							bestDay={(id) => bestDayLabel(places.bestDays[id]?.dayOfMonth)}
							selection={places.filters}
						/>
					</ScrollFade>
				</aside>
			</div>

			{#if showCharts}
				<div
					role="dialog"
					aria-modal="false"
					tabindex="-1"
					aria-label={chartsPickupId ? 'Histórico da unidade' : 'Disponibilidade'}
					class="bg-canvas md:rounded-card md:border-line md:bg-surface md:shadow-float pointer-events-auto absolute inset-0 z-20 flex flex-col overflow-hidden md:inset-auto md:top-20 md:right-4 md:bottom-4 md:w-[26rem] md:border"
					onkeydown={(event) => {
						if (event.key === 'Escape') closeCharts();
					}}
					in:fly={{
						x: isMobile ? 0 : 40,
						y: isMobile ? 32 : 0,
						duration: motion(260),
						easing: cubicOut
					}}
					out:fly={{
						x: isMobile ? 0 : 40,
						y: isMobile ? 32 : 0,
						duration: motion(170),
						easing: cubicOut
					}}
				>
					<header class="flex shrink-0 items-center justify-between px-4 py-3">
						<div>
							<h2 class="text-title-3 font-extrabold">
								{chartsPickupId ? 'Histórico da unidade' : 'Disponibilidade'}
							</h2>
							<p class="text-muted text-footnote">Última leitura de cada dia, em São Paulo.</p>
						</div>
						<button
							type="button"
							bind:this={chartsClose}
							class="text-muted hover:bg-raised hover:text-ink rounded-pill press flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center transition-colors"
							aria-label="Fechar histórico"
							onclick={closeCharts}
						>
							<X size={18} />
						</button>
					</header>

					<ScrollFade class="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
						<AvailabilityCharts pickupId={chartsPickupId} compact />
					</ScrollFade>
				</div>
			{/if}
		</div>
	</div>
</div>
