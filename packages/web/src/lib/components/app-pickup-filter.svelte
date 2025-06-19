<script lang="ts" module>
	import UiSelect from './ui-select.svelte';
	import UiBadge from './ui-badge.svelte';
	import UiInput from './ui-input.svelte';
	import UiLabel from './ui-label.svelte';

	type BusinessHoursOptions = '24h' | 'weekend';

	export type AppPickupFilterProps = {
		searchQuery?: string;
		selectedInsulinTypes?: string[];
		businessHours?: BusinessHoursOptions;
		insulinTypes: { value: string; label: string }[];
	};
</script>

<script lang="ts">
	let {
		searchQuery = $bindable(''),
		businessHours = $bindable(),
		selectedInsulinTypes = $bindable([]),
		insulinTypes
	}: AppPickupFilterProps = $props();

	function handleBusinessHoursChange(value: BusinessHoursOptions) {
		if (value === businessHours) {
			businessHours = undefined;
			return;
		}

		businessHours = value;
	}

	function clearFilters() {
		searchQuery = '';
		selectedInsulinTypes = [];
		businessHours = undefined;
	}

	let hasFilters = $derived.by(
		() => searchQuery || selectedInsulinTypes.length > 0 || businessHours
	);
</script>

<div class="flex flex-col gap-4 border-b border-gray-300 p-4">
	<UiLabel text="Buscar por nome ou endereço.">
		<UiInput bind:value={searchQuery} placeholder="ex: UBS Vila Nova Curuçá ou Rua Danubio" />
	</UiLabel>

	<UiLabel text="Buscar por tipo de insulina.">
		<UiSelect
			placeholder="Selecione um ou mais insulinas"
			type="multiple"
			bind:selected={selectedInsulinTypes}
			items={insulinTypes}
		/>
	</UiLabel>

	<div class="flex flex-col gap-1">
		<UiLabel text="Filtrar por horário" />
		<div class="flex items-center gap-2">
			<UiBadge
				text="Aberto 24h"
				outline={businessHours !== '24h'}
				onClick={() => handleBusinessHoursChange('24h')}
			/>
			<UiBadge
				text="Aberto fim de semana"
				outline={businessHours !== 'weekend'}
				onClick={() => handleBusinessHoursChange('weekend')}
			/>
		</div>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<p class="text-sm font-medium text-gray-500">Exibindo 503 de 503</p>
		<button
			class="h-11 cursor-pointer rounded-xl bg-black px-4 text-sm text-white transition-colors duration-200 ease-in-out hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
			disabled={!hasFilters}
			onclick={clearFilters}
		>
			Limpar filtros
		</button>
	</div>
</div>
