<script lang="ts">
	import { STOCK_LEVELS, STOCK_LEVEL_COLOR, STOCK_LEVEL_LABEL } from '$lib/stock-level';

	type Props = { filtered?: boolean };

	let { filtered = false }: Props = $props();
</script>

<div
	class="rounded-pill bg-surface/85 shadow-float border-line flex flex-wrap items-center gap-x-3 gap-y-1 border px-3 py-2 backdrop-blur-xl"
	aria-label="Legenda de disponibilidade"
>
	<span class="text-faint text-caption whitespace-nowrap">
		{filtered ? 'Cobertura do filtro' : 'Cobertura'}
	</span>

	{#each STOCK_LEVELS as level (level)}
		<span class="text-muted text-caption flex items-center gap-1 whitespace-nowrap">
			<span
				class="h-2 w-2 rounded-full"
				style={`background:${level === 0 ? 'transparent' : STOCK_LEVEL_COLOR[level]};border:1.5px solid ${STOCK_LEVEL_COLOR[level]}`}
			></span>
			{STOCK_LEVEL_LABEL[level]}
		</span>
	{/each}
</div>
