<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from '@storybook/test';
	import UiSelect from './UiSelect.svelte';

	const items = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry', disabled: true },
		{ value: 'date', label: 'Date' }
	];

	const { Story } = defineMeta({
		title: 'UI/Select',
		component: UiSelect,
		tags: ['autodocs'],
		args: { onSelect: fn() }
	});
</script>

<Story
	name="Primary"
	args={{
		items,
		type: 'single',
		onSelect: fn(),
		placeholder: 'Select a fruit'
	}}
/>

<Story
	name="Multi Select"
	args={{
		items,
		type: 'multi',
		onSelect: fn(),
		placeholder: 'Select fruits'
	}}
/>
