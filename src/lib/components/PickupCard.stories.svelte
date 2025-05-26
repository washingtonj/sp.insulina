<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PickupCard from './PickupCard.svelte';
	import data from '$lib/assets/data.json';

	const { Story } = defineMeta({
		title: 'Components/PickupCard',
		component: PickupCard,
		tags: ['autodocs'],
		args: {
			...data[20],
			distanceKm: 2.3,
			selectedInsulinCodes: ['NPH']
		}
	});
</script>

{#snippet template(args)}
	<PickupCard {...args} />
{/snippet}

<Story name="Com todas as props" children={template} />
