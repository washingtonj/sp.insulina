<script lang="ts">
	import { fade } from 'svelte/transition';
	import { motion } from '$lib/motion';
	import ChartDelta from '$lib/components/chart-delta.svelte';
	import ChartLine from '$lib/components/chart-line.svelte';
	import {
		fetchAvailabilitySeries,
		seriesKey,
		toChartRows,
		valuesOf,
		type AvailabilitySeries,
		type ChartSeries,
		type Metric
	} from '$lib/availability-series';
	import { FORMAT_LABELS, VISIBLE_FORMATS, type InsulinType } from '$lib/places';
	import { formatShortDay } from '$lib/utils/date';

	type Props = {
		pickupId?: string;
		compact?: boolean;
	};

	let { pickupId, compact = false }: Props = $props();

	const FORMAT_COLORS: Partial<Record<InsulinType, string>> = {
		REFILL: 'var(--series-1)',
		AMPOLA: 'var(--series-2)'
	};

	const FORMAT_ORDER: InsulinType[] = VISIBLE_FORMATS;
	const VARIANTS = [
		{ variant: 'NPH' as const, label: 'NPH' },
		{ variant: 'REGULAR' as const, label: 'Regular' }
	];
	const PERIODS = [7, 14, 30, 90];

	const METRICS: Record<Metric, string> = {
		pickups: 'UBS com estoque',
		quantity: 'Unidades'
	};

	let period = $state(30);
	let metricChoice = $state<Metric>('pickups');
	let data = $state<AvailabilitySeries | null>(null);
	let error = $state<string | null>(null);
	let isLoading = $state(true);
	let requestId = 0;

	const metric = $derived<Metric>(pickupId ? 'quantity' : metricChoice);

	let groups = $derived.by(() => {
		const series = data;
		if (!series) return [];

		return VARIANTS.map(({ variant, label }) => {
			const entries = series.series
				.filter((entry) => entry.variant === variant && VISIBLE_FORMATS.includes(entry.type))
				.sort((a, b) => FORMAT_ORDER.indexOf(a.type) - FORMAT_ORDER.indexOf(b.type));

			const rows = toChartRows(series.days, entries, metric);

			return {
				variant,
				label,
				rows,
				series: entries.map<ChartSeries>((entry) => ({
					key: seriesKey(entry),
					label: FORMAT_LABELS[entry.type],
					color: FORMAT_COLORS[entry.type] ?? 'var(--series-3)',
					values: valuesOf(rows, seriesKey(entry))
				}))
			};
		});
	});

	let hasData = $derived(
		groups.some((group) => group.series.some((item) => item.values.some((value) => value !== null)))
	);

	async function load(days: number, pickupId: string | undefined) {
		const id = ++requestId;

		try {
			isLoading = true;
			error = null;
			const result = await fetchAvailabilitySeries(days, pickupId);
			if (id !== requestId) return;

			data = result;
		} catch (cause) {
			if (id !== requestId) return;

			console.error(cause);
			error = 'Não foi possível carregar o histórico. Verifique sua conexão e tente novamente.';
		} finally {
			if (id === requestId) isLoading = false;
		}
	}

	$effect(() => {
		void load(period, pickupId);
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		{#if !pickupId}
			<div
				role="group"
				aria-label="Métrica"
				class="border-line bg-surface rounded-pill flex w-full items-center gap-1 border p-1"
			>
				{#each Object.entries(METRICS) as [key, label] (key)}
					<button
						type="button"
						aria-pressed={metricChoice === key}
						class={[
							'text-footnote h-9 flex-1 cursor-pointer rounded-full px-3 text-center font-medium transition-colors',
							{
								'bg-ink text-canvas': metricChoice === key,
								'text-muted hover:text-ink': metricChoice !== key
							}
						]}
						onclick={() => (metricChoice = key as Metric)}
					>
						{label}
					</button>
				{/each}
			</div>
		{/if}

		<div
			role="group"
			aria-label="Período"
			class="border-line bg-surface rounded-pill flex w-full items-center gap-1 border p-1"
		>
			{#each PERIODS as option (option)}
				<button
					type="button"
					aria-pressed={period === option}
					class={[
						'text-footnote h-9 flex-1 cursor-pointer rounded-full px-3 text-center font-medium transition-colors',
						{
							'bg-ink text-canvas': period === option,
							'text-muted hover:text-ink': period !== option
						}
					]}
					onclick={() => (period = option)}
				>
					{option}d
				</button>
			{/each}
		</div>
	</div>

	{#if isLoading}
		<div class="flex flex-col gap-4" in:fade={{ duration: motion(160) }}>
			{#each [0, 1] as card (card)}
				<div class="rounded-card border-line bg-surface border p-4">
					<div class="skeleton h-4 w-16 rounded"></div>
					<div class="skeleton mt-3 h-56 rounded-xl"></div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div
			class="flex flex-col items-center gap-3 py-12 text-center"
			in:fade={{ duration: motion(160) }}
		>
			<p class="text-muted text-footnote">{error}</p>
			<button
				type="button"
				class="text-ink bg-raised hover:ring-faint/40 press rounded-pill flex h-11 cursor-pointer items-center px-4 transition-shadow hover:ring-1"
				onclick={() => void load(period, pickupId)}
			>
				<span class="text-footnote font-medium">Tentar novamente</span>
			</button>
		</div>
	{:else if !hasData}
		<p class="text-muted text-footnote py-12 text-center">
			Sem histórico no período selecionado. Os dados começam a aparecer depois da primeira coleta
			diária.
		</p>
	{:else}
		<div class="flex flex-col gap-4" in:fade={{ duration: motion(180) }}>
			{#each groups as group (group.variant)}
				<section class="border-line bg-surface animate-rise-in rounded-card border p-4">
					<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
						<h2 class="text-muted text-footnote font-semibold uppercase">{group.label}</h2>
						<div class="text-muted text-caption flex flex-wrap gap-3">
							{#each group.series as item (item.key)}
								<span class="flex items-center gap-1">
									<span class="h-2 w-2 rounded-full" style={`background:${item.color}`}></span>
									{item.label}
								</span>
							{/each}
						</div>
					</div>
					<ChartLine rows={group.rows} series={group.series} height={compact ? 200 : 240} />
				</section>
			{/each}

			<section class="border-line bg-surface animate-rise-in rounded-card border p-4">
				<h2 class="text-muted text-footnote font-semibold uppercase">Variação diária</h2>
				<p class="text-muted text-footnote mb-3">
					Diferença em relação ao dia anterior, por apresentação.
				</p>
				<ChartDelta
					days={data?.days ?? []}
					series={groups.flatMap((group) =>
						group.series.map((item) => ({ ...item, label: `${group.label} · ${item.label}` }))
					)}
				/>
				{#if data}
					<p class="text-muted text-caption mt-3">
						Último dado em {formatShortDay(data.days[data.days.length - 1])}. Unidade fechada mantém
						o último valor conhecido no dia.
					</p>
				{/if}
			</section>
		</div>
	{/if}
</div>
