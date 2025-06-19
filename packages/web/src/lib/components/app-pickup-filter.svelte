<script>
	import UiSelect from './ui-select.svelte';
	import UiBadge from './ui-badge.svelte';
	import UiInput from './ui-input.svelte';
	import UiLabel from './ui-label.svelte';
</script>

<div class="flex flex-col gap-4 border-b border-gray-300 p-4">
	<UiLabel text="Buscar por nome ou endereço.">
		<UiInput value="" placeholder="ex: UBS Vila Nova Curuçá ou Rua Danubio" />
	</UiLabel>

	<UiLabel text="Buscar por tipo de insulina.">
		<UiSelect
			placeholder="Selecione um ou mais insulinas"
			type="multiple"
			selected={[]}
			onSelect={(e) => console.log(e)}
			items={[
				{ value: 'nph', label: 'Caneta - NPH' },
				{ value: 'regular', label: 'Caneta - Regular' },
				{ value: 'ampola-nph', label: 'Ampola - NPH' },
				{ value: 'ampola-regular', label: 'Ampola - Regular' },
				{ value: 'refill-nph', label: 'Refill - NPH' },
				{ value: 'refill-regular', label: 'Refill - Regular' }
			]}
		/>
	</UiLabel>

	<div class="flex flex-col gap-1">
		<UiLabel text="Filtrar por horário" />
		<div class="flex items-center gap-2">
			<UiBadge text="Aberto 24h" outline onClick={() => {}} />
			<UiBadge text="Aberto fim de semana" outline onClick={() => {}} />
		</div>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<p class="text-sm font-medium text-gray-500">Exibindo 503 de 503</p>
		<button
			class="h-11 cursor-pointer rounded-xl bg-black px-4 text-sm text-white transition-colors duration-200 ease-in-out hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
			disabled={true}>Limpar filtros</button
		>
	</div>
</div>
