<script lang="ts">
	type UiLabelProps = {
		text: string;
		children?: () => any;
	};

	let { children, text }: UiLabelProps = $props();
</script>

<label class="flex flex-col gap-1 text-sm font-medium">
	{text}
	{@render children?.()}
</label>
