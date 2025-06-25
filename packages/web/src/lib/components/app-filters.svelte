<script lang="ts">
	import UiButton from './ui-button.svelte';
	import UiInput from './ui-input.svelte';
	import UiSelect from './ui-select.svelte';
	import { clickOutside } from '$lib/directives/click-outside';

	type InsulinType = {
		value: string;
		label: string;
	};

	type Props = {
		search?: string;
		insulinTypes?: string[];
		openStatus?: string;
		allInsulinTypes?: InsulinType[];
		onClickOutside?: () => void;
	};

	let {
		search = $bindable(''),
		insulinTypes = $bindable([]),
		openStatus = $bindable(),
		allInsulinTypes = $bindable([]),
		onClickOutside = () => {}
	}: Props = $props();
</script>

<div
	use:clickOutside={{
		callback: onClickOutside
	}}
	class="flex flex-col gap-3 rounded-2xl border border-gray-300 bg-white p-4 shadow-lg transition-transform duration-200"
>
	<span class="mb-2">
		<h5 class="text-lg font-bold">Filtrar</h5>
		<p class="text-sm text-gray-400">Melhore a precisão da pesquisa adicionado filtro.</p>
	</span>

	<div class="flex flex-col gap-3 rounded-2xl border border-gray-300 bg-white p-4 shadow-xl">
		<UiInput placeholder="Buscar por nome ou endereço" bind:value={search} />
		<UiSelect
			items={allInsulinTypes}
			type="multiple"
			bind:selected={insulinTypes}
			placeholder="Tipo de insulina"
		/>
		<UiSelect
			items={[
				{ value: undefined, label: 'Todos' },
				{ value: '24h', label: '24h' },
				{ value: 'weekend', label: 'Fim de semana' }
			]}
			bind:selected={openStatus}
			placeholder="Aberto"
		/>
	</div>

	<UiButton
		onClick={() => {
			search = '';
			insulinTypes = [];
			openStatus = undefined;
		}}>Limprar filtros</UiButton
	>
</div>
