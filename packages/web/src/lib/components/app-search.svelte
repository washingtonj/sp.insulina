<script lang="ts">
	import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
	import type { Snippet } from 'svelte';

	type Props = {
		value?: string;
		placeholder?: string;
		trailing?: Snippet;
	};

	let { value = $bindable(''), placeholder = 'Nome ou endereço', trailing }: Props = $props();
</script>

<div
	class="rounded-pill bg-raised focus-within:ring-ink flex h-11 w-full items-center gap-2 pr-1 pl-4 transition-shadow focus-within:ring-2"
>
	<MagnifyingGlass class="text-muted shrink-0" size={18} />
	<input
		class="placeholder-faint text-body h-full w-full min-w-0 border-0 bg-transparent p-0 outline-none focus:border-0 focus:ring-0"
		type="text"
		{placeholder}
		bind:value
	/>
	{@render trailing?.()}
</div>
