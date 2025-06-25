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
		'focus:ring-black-500 cursor-pointer rounded-md border px-4 py-2 text-sm font-medium focus:ring-2 focus:outline-none',
		{
			primary:
				'border-black-500 bg-black-500 hover:bg-black-600 focus:border-black-700 bg-black text-white',
			secondary:
				'focus:border-black-500 border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200',
			ghost:
				'focus:border-black-500 border-transparent bg-transparent text-gray-700 hover:bg-gray-100'
		}[variant]
	]}
>
	{@render children?.()}
</button>
