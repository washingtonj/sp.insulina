<script lang="ts">
	import { Funnel } from 'phosphor-svelte';
	import { fly, scale } from 'svelte/transition';

	type Props = {
		onClick?: () => void;
	};

	let { onClick = () => {} }: Props = $props();
</script>

<button
	transition:fly={{ y: 200 }}
	class="z-0 h-14 w-fit cursor-pointer rounded-xl border border-gray-300 bg-white px-4 shadow-lg"
	onclick={onClick}
>
	<Funnel size={18} weight="fill" />
</button>
