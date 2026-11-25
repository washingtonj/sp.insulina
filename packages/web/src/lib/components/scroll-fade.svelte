<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: scrollerClass = '' }: Props = $props();

	let scroller = $state<HTMLDivElement | null>(null);
	let atTop = $state(true);
	let atBottom = $state(true);

	function update() {
		if (!scroller) return;

		const { scrollTop, clientHeight, scrollHeight } = scroller;
		atTop = scrollTop <= 2;
		atBottom = scrollTop + clientHeight >= scrollHeight - 2;
	}

	$effect(() => {
		const node = scroller;
		if (!node) return;

		update();

		const resize = new ResizeObserver(update);
		resize.observe(node);

		const content = new MutationObserver(update);
		content.observe(node, { childList: true, subtree: true });

		return () => {
			resize.disconnect();
			content.disconnect();
		};
	});
</script>

<div class="relative min-h-0 flex-1">
	<div
		bind:this={scroller}
		onscroll={update}
		class={['scroll-fade h-full overflow-y-auto overscroll-contain', scrollerClass]}
		style={`--fade-top:${atTop ? 0 : 28}px;--fade-bottom:${atBottom ? 0 : 28}px`}
	>
		{@render children()}
	</div>
</div>

<style>
	.scroll-fade {
		scrollbar-width: none;
		-ms-overflow-style: none;
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0,
			#000 var(--fade-top),
			#000 calc(100% - var(--fade-bottom)),
			transparent 100%
		);
		mask-image: linear-gradient(
			to bottom,
			transparent 0,
			#000 var(--fade-top),
			#000 calc(100% - var(--fade-bottom)),
			transparent 100%
		);
	}

	.scroll-fade::-webkit-scrollbar {
		display: none;
	}
</style>
