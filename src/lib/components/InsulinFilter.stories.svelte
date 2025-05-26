<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import InsulinFilter from './InsulinFilter.svelte';
	import { AvailabilityEntity } from '$core/entities/availability';
	import data from '$lib/assets/data.json';

	const mockData = data as AvailabilityEntity[];

	const { Story } = defineMeta({
		title: 'Components/Insulin/Filter',
		component: InsulinFilter,
		tags: ['autodocs'],
		args: {
			data: mockData,
			filtered: []
		}
	});
</script>

<Story name="Default">
	<InsulinFilter data={mockData} filtered={[]} />
</Story>
