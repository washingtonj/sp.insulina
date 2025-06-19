<script>
	let { children } = $props();
</script>

<p class="rounded-lg bg-gray-100 p-4 text-sm text-gray-500">
	{@render children()}
</p>
