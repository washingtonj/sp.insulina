<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import InsulinFilter from './InsulinFilter.svelte';
	import { AvailabilityEntity } from '../../core/entities/availability';

	const mockData = [
		{
			pickup: {
				placeName: 'Posto Central',
				address: {
					address: 'Rua Central, 123',
					latitude: -23.5505,
					longitude: -46.6333
				}
			},
			quantity: [
				{
					insulin: { code: 'NPH', simpleName: 'NPH', type: 'AMPOLA', fullName: 'Insulina NPH' },
					quantity: 50,
					level: 3
				},
				{
					insulin: {
						code: 'REG',
						simpleName: 'Regular',
						type: 'AMPOLA',
						fullName: 'Insulina Regular'
					},
					quantity: 20,
					level: 2
				}
			]
		},
		{
			pickup: {
				placeName: 'Posto Norte',
				address: {
					address: 'Av. Norte, 456',
					latitude: -23.52,
					longitude: -46.62
				}
			},
			quantity: [
				{
					insulin: { code: 'NPH', simpleName: 'NPH', type: 'CANETA', fullName: 'Insulina NPH' },
					quantity: 10,
					level: 2
				},
				{
					insulin: {
						code: 'GLAR',
						simpleName: 'Glargina',
						type: 'CANETA',
						fullName: 'Insulina Glargina'
					},
					quantity: 30,
					level: 3
				}
			]
		},
		{
			pickup: {
				placeName: 'Posto Sul',
				address: {
					address: 'Rua Sul, 789',
					latitude: -23.58,
					longitude: -46.64
				}
			},
			quantity: [
				{
					insulin: {
						code: 'REG',
						simpleName: 'Regular',
						type: 'AMPOLA',
						fullName: 'Insulina Regular'
					},
					quantity: 5,
					level: 1
				},
				{
					insulin: {
						code: 'GLAR',
						simpleName: 'Glargina',
						type: 'CANETA',
						fullName: 'Insulina Glargina'
					},
					quantity: 15,
					level: 2
				}
			]
		}
	] as AvailabilityEntity[];

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
