<script lang="ts">
	import { Select } from 'bits-ui';
	import Check from 'phosphor-svelte/lib/Check';
	import { onMount } from 'svelte';

	type Props = {
		items: { value: string; label: string; disabled?: boolean }[];
		type: 'single' | 'multiple';
		onSelect: (value: string | string[]) => void;
		selected?: string | string[];
		placeholder?: string;
	};

	let { items, type, onSelect, placeholder, selected = $bindable() }: Props = $props();

	let selectedLabel = $derived.by(() => {
		if (!selected || selected.length === 0) return '';

		if (type === 'single') {
			const found = items.find((item) => item.value === selected);
			return found!.label;
		}

		if (type === 'multiple') {
			return items
				.filter((item) => selected!.includes(item.value))
				.map((item) => item.label)
				.join(', ');
		}
	});

	let triggerEl: HTMLButtonElement | null = $state(null);
	let dropdownWidth = $state('auto');

	function updateDropdownWidth() {
		if (triggerEl) {
			dropdownWidth = `${triggerEl.offsetWidth}px`;
		}
	}

	function handleValueChange(value: string | string[]) {
		selected = value;
		onSelect(value);
	}

	onMount(() => {
		updateDropdownWidth();
		window.addEventListener('resize', updateDropdownWidth);
		return () => window.removeEventListener('resize', updateDropdownWidth);
	});
</script>

<Select.Root {type} onValueChange={handleValueChange} {items}>
	<Select.Trigger
		bind:ref={triggerEl}
		class="flex w-full items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors select-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
		aria-label={placeholder}
		onclick={updateDropdownWidth}
	>
		<span class={selectedLabel ? '' : 'text-gray-400'}>
			{selectedLabel || placeholder}
		</span>
	</Select.Trigger>
	<Select.Portal>
		<Select.Content
			class="z-50 mt-1 max-h-60 rounded-md border border-gray-200 bg-white px-0 py-1 shadow-lg outline-none select-none"
			sideOffset={4}
		>
			<Select.Viewport class="p-1" style={`min-width: ${dropdownWidth}; width: ${dropdownWidth};`}>
				{#each items as item, i (i + item.value)}
					<Select.Item
						class="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors select-none hover:bg-blue-50 data-disabled:opacity-50"
						value={item.value}
						label={item.label}
						disabled={item.disabled}
					>
						{#snippet children({ selected })}
							{item.label}
							{#if selected}
								<div class="ml-auto">
									<Check aria-label="check" />
								</div>
							{/if}
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>
