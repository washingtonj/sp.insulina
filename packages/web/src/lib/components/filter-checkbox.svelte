<script lang="ts">
	import { Checkbox } from 'bits-ui';
	import Check from 'phosphor-svelte/lib/Check';

	type Props = {
		id: string;
		label: string;
		checked: boolean;
		onchange: (checked: boolean) => void;
	};

	let { id, label, checked, onchange }: Props = $props();
</script>

<div class="flex min-h-11 items-center gap-3">
	<Checkbox.Root
		{id}
		{checked}
		onCheckedChange={onchange}
		class="border-line bg-surface data-[state=checked]:border-ink data-[state=checked]:bg-ink hover:border-faint flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all"
	>
		{#snippet children({ checked })}
			{#if checked}
				<Check class="text-canvas h-3.5 w-3.5" weight="bold" />
			{/if}
		{/snippet}
	</Checkbox.Root>
	<label
		for={id}
		class="text-ink text-subhead flex flex-1 cursor-pointer items-center self-stretch font-medium"
	>
		{label}
	</label>
</div>
