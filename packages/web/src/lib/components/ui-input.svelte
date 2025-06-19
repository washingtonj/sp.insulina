<script lang="ts">
	type Props = {
		onInput?: (value: string) => void;
		value?: string;
		placeholder?: string;
	};

	let { onInput, value = $bindable(), placeholder }: Props = $props();

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		value = input.value;
		onInput?.(value);
	}
</script>

<div class="relative w-full">
	<input
		type="text"
		{value}
		{placeholder}
		oninput={handleInput}
		class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors select-none placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black focus:outline-none"
	/>
</div>
