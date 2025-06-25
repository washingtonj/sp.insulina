<script lang="ts">
	import InsulinRefillIcon from './icon-insulin-refill.svelte';
</script>

{#snippet logo()}
	<div class="flex items-center">
		<InsulinRefillIcon class="h-6 w-8" />
		<span class="mx-3 h-6 border-l border-black"></span>
		<h1 class="flex flex-col items-start text-2xl font-bold">
			<div class="flex items-center">
				<span>sp.</span>
				<span class="text-gray-500">insulina</span>
			</div>
		</h1>
	</div>
{/snippet}

<div class="flex h-14 w-fit items-center rounded-lg border border-gray-300 bg-white px-4 shadow-xl">
	{@render logo()}
</div>
