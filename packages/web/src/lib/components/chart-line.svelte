<script lang="ts">
	import { LineChart, Tooltip } from 'layerchart';
	import type { ChartRow, ChartSeries } from '$lib/availability-series';
	import { formatAxisDate, formatFullDate } from '$lib/utils/date';

	type Props = {
		rows: ChartRow[];
		series: ChartSeries[];
		height?: number;
	};

	let { rows, series, height = 240 }: Props = $props();

	let chartSeries = $derived(series.map(({ key, label, color }) => ({ key, label, color })));
</script>

<LineChart
	data={rows}
	x="date"
	series={chartSeries}
	{height}
	yDomain={[0, null]}
	tooltipContext={{ mode: 'bisect-x' }}
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
					{#each series as item (item.key)}
						<Tooltip.Item seriesKey={item.key} format="integer" />
					{/each}
				</Tooltip.List>
			{/snippet}
		</Tooltip.Root>
	{/snippet}
</LineChart>
