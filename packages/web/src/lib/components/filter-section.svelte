<script lang="ts">
	import FilterCheckbox from './filter-checkbox.svelte';

	type Option = { value: string; label: string };

	type Props = {
		title: string;
		options: readonly Option[];
		selected: readonly string[];
		idPrefix: string;
		ontoggle: (value: string) => void;
	};

	let { title, options, selected, idPrefix, ontoggle }: Props = $props();
</script>

<div>
	<h4 class="text-footnote text-muted font-medium">{title}</h4>
	<div>
		{#each options as option (option.value)}
			<FilterCheckbox
				id={`${idPrefix}${option.value.toLowerCase()}`}
				label={option.label}
				checked={selected.includes(option.value)}
				onchange={() => ontoggle(option.value)}
			/>
		{/each}
	</div>
</div>
