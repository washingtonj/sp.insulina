<script>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import PickupCard from './PickupCard.svelte';

  const { Story } = defineMeta({
    title: 'Components/PickupCard',
    component: PickupCard,
    tags: ['autodocs']
  });

  const pickup = {
    placeName: 'Posto Central',
    address: { address: 'Rua Central, 123' }
  };

  const selectedInsulins = [
    {
      insulin: { code: 'NPH', simpleName: 'NPH', type: 'AMPOLA' },
      level: 3,
      quantity: 50
    },
    {
      insulin: { code: 'REG', simpleName: 'Regular', type: 'AMPOLA' },
      level: 2,
      quantity: 20
    }
  ];

  const otherInsulins = [
    {
      insulin: { code: 'GLAR', simpleName: 'Glargina', type: 'CANETA' },
      level: 1,
      quantity: 5
    }
  ];
</script>

<Story name="Com todas as props">
  <PickupCard
    pickup={pickup}
    selectedInsulins={selectedInsulins}
    otherInsulins={otherInsulins}
    distanceKm={2.3}
  />
</Story>

<Story name="Sem outras insulinas">
  <PickupCard
    pickup={pickup}
    selectedInsulins={selectedInsulins}
    otherInsulins={[]}
    distanceKm={1.1}
  />
</Story>

<Story name="Sem distância">
  <PickupCard
    pickup={pickup}
    selectedInsulins={selectedInsulins}
    otherInsulins={otherInsulins}
    distanceKm={null}
  />
</Story>

<Story name="Somente uma insulina selecionada">
  <PickupCard
    pickup={pickup}
    selectedInsulins={[selectedInsulins[0]]}
    otherInsulins={[selectedInsulins[1], ...otherInsulins]}
    distanceKm={0.7}
  />
</Story>
