<script lang="ts">
	import { BarChart, Tooltip } from 'layerchart';
	import { deltaAt, type ChartSeries } from '$lib/availability-series';
	import { formatAxisDate, formatFullDate } from '$lib/utils/date';

	type Props = {
		days: string[];
		series: ChartSeries[];
	};

	let { days, series }: Props = $props();

	const UP = '#34d399';
	const DOWN = '#f87171';

	let selectedKey = $state('');

	let selected = $derived(series.find((item) => item.key === selectedKey) ?? series[0]);

	$effect(() => {
		if (series.length > 0 && !series.some((item) => item.key === selectedKey)) {
			selectedKey = series[0].key;
		}
	});

	let rows = $derived.by(() => {
		const values = selected?.values ?? [];

		return days.map((day, index) => {
			const delta = deltaAt(values, index);

			return {
				date: new Date(`${day}T12:00:00.000Z`),
				aumentou: delta !== null && delta > 0 ? delta : null,
				caiu: delta !== null && delta < 0 ? delta : null
			};
		});
	});

	let hasDelta = $derived(rows.some((row) => row.aumentou !== null || row.caiu !== null));
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-col gap-2">
		<label class="text-muted text-footnote font-medium" for="delta-series">Série</label>
		<select
			id="delta-series"
			class="border-line bg-surface rounded-pill text-ink text-footnote h-11 w-full cursor-pointer border px-4 font-medium"
			bind:value={selectedKey}
		>
			{#each series as item (item.key)}
				<option value={item.key}>{item.label}</option>
			{/each}
		</select>
	</div>

	{#if hasDelta}
		<BarChart
			data={rows}
			x="date"
			series={[
				{ key: 'aumentou', label: 'Aumentou', color: UP },
				{ key: 'caiu', label: 'Caiu', color: DOWN }
			]}
			height={180}
			props={{
				xAxis: {
					format: formatAxisDate,
					tickSpacing: 72
				},
				yAxis: { format: 'integer' }
			}}
		>
			{#snippet tooltip()}
				<Tooltip.Root>
					{#snippet children({ data })}
						<Tooltip.Header value={formatFullDate(data.date)} />
						<Tooltip.List>
							<Tooltip.Item seriesKey="aumentou" format="integer" />
							<Tooltip.Item seriesKey="caiu" format="integer" />
						</Tooltip.List>
					{/snippet}
				</Tooltip.Root>
			{/snippet}
		</BarChart>

		<div class="text-caption text-muted flex items-center gap-2">
			<span class="flex items-center gap-2">
				<span class="h-2 w-2 rounded-sm" style={`background:${UP}`}></span> aumentou
			</span>
			<span class="flex items-center gap-2">
				<span class="h-2 w-2 rounded-sm" style={`background:${DOWN}`}></span> caiu
			</span>
		</div>
	{:else}
		<p class="text-muted text-footnote py-8 text-center">Sem variação no período.</p>
	{/if}
</div>
