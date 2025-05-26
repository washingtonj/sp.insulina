<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		onClick?: () => void;
		children?: Snippet;
		variant?: 'primary' | 'secondary' | 'ghost';
	};

	let { onClick, children, variant = 'primary' }: Props = $props();
</script>

<button
	onclick={onClick}
	class={[
		'rounded-md border px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none',
		{
			primary: 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600 focus:border-blue-700',
			secondary:
				'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 focus:border-blue-500',
			ghost:
				'border-transparent bg-transparent text-gray-700 hover:bg-gray-100 focus:border-blue-500'
		}[variant]
	]}
>
	{@render children?.()}
</button>
