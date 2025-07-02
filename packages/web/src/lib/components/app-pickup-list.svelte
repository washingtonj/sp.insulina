<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		isEmpty?: boolean;
		isLoading?: boolean;
		isError?: boolean;
		children: Snippet;
	};

	let { isEmpty = false, isLoading = false, isError = false, children }: Props = $props();

	let scrollContainer: HTMLDivElement | null = $state(null);
	let showBottomBlur = $state(false);
	let showTopBlur = $state(false);

	function handleScroll() {
		if (!scrollContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		showBottomBlur = scrollTop + clientHeight < scrollHeight - 5;
		showTopBlur = scrollTop > 5;
	}
</script>

{#snippet blur(isBottom: boolean = false)}
	<div
		class={[
			'pointer-events-none absolute left-0 h-8 from-black/20 to-transparent',
			{
				'right-0 bottom-0 bg-gradient-to-t': isBottom,
				'top-0 right-0 bg-gradient-to-b': !isBottom
			}
		]}
	></div>
{/snippet}

<div class="relative h-full overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-xl">
	<div
		bind:this={scrollContainer}
		onscroll={handleScroll}
		class="custom-scrollbar h-full overflow-y-auto"
	>
		<div class="p-4">
			<div class="flex flex-col gap-4">
				{#if isEmpty}
					<div class="py-8 text-center text-sm text-gray-400">Nenhum local encontrado.</div>
				{:else if isLoading}
					<div class="py-8 text-center text-sm text-gray-400">Carregando...</div>
				{:else if isError}
					<div class="py-8 text-center text-sm text-red-500">Erro ao carregar dados.</div>
				{:else}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>

	{#if showTopBlur}
		{@render blur()}
	{/if}
	{#if showBottomBlur}
		{@render blur(true)}
	{/if}
</div>

<style>
	/* Hide scrollbar */
	.custom-scrollbar::-webkit-scrollbar {
		display: none;
	}

	/* Firefox scrollbar hiding */
	.custom-scrollbar {
		scrollbar-width: none;
	}
</style>
