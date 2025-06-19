<script module>
	import AppPickupCard from '../app-pickup-card.svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from '@storybook/test';

	const { Story } = defineMeta({
		title: 'App/PickupCard',
		component: AppPickupCard,
		args: { onSelect: fn() }
	});
</script>

<Story
	name="Primary"
	args={{
		pickupName: 'UBS Vila Caiuba',
		pickupAddress: 'Rua das Flores, 123, São Paulo - SP',
		businessHours: ['Segunda a Sexta: 09:00 - 19:00', 'Sábado: 09:00 - 14:00'],
		data: [
			{
				type: 'pen',
				nph: { quantity: 74, level: 1 },
				regular: { quantity: 1000, level: 0 },
				history: [
					{ date: '2024-06-01', nph: 80, regular: 100 },
					{ date: '2024-06-02', nph: 60, regular: 120 },
					{ date: '2024-06-03', nph: 90, regular: 80 },
					{ date: '2024-06-04', nph: 50, regular: 130 },
					{ date: '2024-06-05', nph: 100, regular: 70 },
					{ date: '2024-06-06', nph: 65, regular: 110 },
					{ date: '2024-06-07', nph: 85, regular: 95 }
				]
			},
			{
				type: 'vial',
				nph: { quantity: 1200, level: 2 },
				regular: { quantity: 39, level: 1 },
				history: [
					{ date: '2024-06-01', nph: 1200, regular: 39 },
					{ date: '2024-06-02', nph: 1190, regular: 41 },
					{ date: '2024-06-03', nph: 1180, regular: 2431 },
					{ date: '2024-06-04', nph: 1170, regular: 45 },
					{ date: '2024-06-05', nph: 1160, regular: 47 },
					{ date: '2024-06-06', nph: 1150, regular: 49 },
					{ date: '2024-06-07', nph: 1140, regular: 51 }
				]
			},
			{
				type: 'refill',
				nph: { quantity: 0, level: 0 },
				regular: { quantity: 933, level: 2 },
				history: [
					{ date: '2024-06-01', nph: 0, regular: 933 },
					{ date: '2024-06-02', nph: 0, regular: 913 },
					{ date: '2024-06-03', nph: 0, regular: 893 },
					{ date: '2024-06-04', nph: 0, regular: 873 },
					{ date: '2024-06-05', nph: 0, regular: 853 },
					{ date: '2024-06-06', nph: 0, regular: 833 },
					{ date: '2024-06-07', nph: 0, regular: 813 }
				]
			}
		]
	}}
/>
