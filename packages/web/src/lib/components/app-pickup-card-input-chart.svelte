<script lang="ts" module>
	export interface InsulinHistoryEntry {
		date: string;
		nph: number;
		regular: number;
	}
</script>

<script lang="ts">
	type Props = {
		history: InsulinHistoryEntry[];
	};

	let { history }: Props = $props();

	// Chart dimensions and padding
	const chartWidth = 240;
	const chartHeight = 24;
	const padding = 4;

	// Defensive: avoid division by zero
	const n = history.length;
	const maxNph = Math.max(...history.map((h) => h.nph), 1);
	const maxRegular = Math.max(...history.map((h) => h.regular), 1);
	const maxY = Math.max(maxNph, maxRegular, 1);

	// Y-axis scaling: higher values are lower on the SVG
	function yScale(value: number) {
		return chartHeight - padding - (value / maxY) * (chartHeight - 2 * padding);
	}

	// X-axis step
	const xStep = n > 1 ? (chartWidth - 2 * padding) / (n - 1) : 0;

	// Points for polylines and dots
	let pointsNph = $derived(history.map((h, i) => [padding + i * xStep, yScale(h.nph)]));
	let pointsRegular = $derived(history.map((h, i) => [padding + i * xStep, yScale(h.regular)]));
</script>

<div class="flex w-full flex-col items-center py-2">
	<svg
		width="100%"
		height={chartHeight}
		viewBox={`0 0 ${chartWidth} ${chartHeight}`}
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class="w-full"
	>
		<!-- NPH polyline (black) -->
		<polyline
			points={pointsNph.map(([x, y]) => `${x},${y}`).join(' ')}
			fill="none"
			stroke="#111111"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<!-- NPH dots (black) -->
		{#each pointsNph as [x, y]}
			<circle cx={x} cy={y} r="2" fill="#111111" />
		{/each}
		<!-- Regular polyline (gray) -->
		<polyline
			points={pointsRegular.map(([x, y]) => `${x},${y}`).join(' ')}
			fill="none"
			stroke="#6b7280"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<!-- Regular dots (gray) -->
		{#each pointsRegular as [x, y]}
			<circle cx={x} cy={y} r="2" fill="#6b7280" />
		{/each}
	</svg>
	<div class="mt-1 flex w-full justify-center gap-3 text-xs text-gray-600">
		<span class="flex items-center gap-1">
			<span class="inline-block h-1 w-3 rounded bg-black"></span>NPH
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-1 w-3 rounded bg-gray-500"></span>Regular
		</span>
	</div>
</div>
