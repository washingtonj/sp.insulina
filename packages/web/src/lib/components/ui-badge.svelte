<script lang="ts">
	type Props = {
		text: string;
		color?: 'blue' | 'green';
		outline?: boolean;
		onClick?: () => void;
	};

	let { text, outline = false, onClick }: Props = $props();
</script>

{#if onClick}
	<button
		type="button"
		onclick={onClick}
		class={[
			'w-fit rounded-lg px-2 py-1 text-xs transition-colors duration-300 focus:outline-none',
			outline
				? 'border border-black bg-transparent text-black hover:bg-black hover:text-white'
				: 'bg-black text-white hover:bg-gray-800',
			'cursor-pointer'
		]}
	>
		<p>{text}</p>
	</button>
{:else}
	<div
		class={[
			'w-fit rounded-lg px-2 py-1 text-xs',
			outline ? 'border border-black bg-transparent text-black' : 'bg-black text-white'
		]}
	>
		<p>{text}</p>
	</div>
{/if}
