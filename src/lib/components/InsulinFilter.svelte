<script lang="ts">
	import LocationIcon from 'phosphor-svelte/lib/Gps';
	import UiSelect from './ui/UiSelect.svelte';
	import UiButton from './ui/UiButton.svelte';
	import UiInput from './ui/UiInput.svelte';
	import type { InsulinEntity } from '$core/entities/insulin';

	type Props = {
		searchQuery: string;
		requestedInsulins: InsulinEntity[];
		availableInsulins: InsulinEntity[];
		isOrderByNearest: boolean;
		location: {
			isLoading: boolean;
			error?: string;
		};
		totals: {
			data: number;
			filtered: number;
		};
		onOrderByNearest: () => void;
	};

	let {
		searchQuery = $bindable(''),
		requestedInsulins = $bindable([]),
		isOrderByNearest = $bindable(false),
		onOrderByNearest,
		availableInsulins,
		totals,
		location
	}: Props = $props();

	function handleSelectInsulins(codes: string[] | string) {
		if (typeof codes === 'string') {
			codes = [codes];
		}

		requestedInsulins = codes
			.map((code) => availableInsulins.find((insulin) => insulin.code === code))
			.filter((insulin) => insulin !== undefined);
	}

	function handleClearFilters() {
		searchQuery = '';
		requestedInsulins = [];
		isOrderByNearest = false;
	}

	function handleOrderByNearest() {
		if (location.isLoading) return;
		if (!isOrderByNearest) onOrderByNearest();
		isOrderByNearest = !isOrderByNearest;
	}
</script>

<div class="filter-container rounded-lg border border-gray-200 bg-white p-4">
	<div class="flex flex-col space-y-4">
		<div>
			<label class="items-center gap-2 text-sm font-medium text-gray-700">
				Buscar por nome do posto ou endereço
				<UiInput placeholder="Digite para buscar..." bind:value={searchQuery} />
			</label>
			{#if location.error}
				<div class="mt-1 text-xs text-red-600">{location.error}</div>
			{/if}
			{#if isOrderByNearest}
				<div class="mt-1 text-xs text-blue-600">Ordenando por proximidade da sua localização.</div>
			{/if}
		</div>

		<label class="block text-sm font-medium text-gray-700">
			Selecionar Insulinas
			<UiSelect
				items={availableInsulins.map((insulin) => ({
					value: insulin.code,
					label: `${insulin.simpleName} (${insulin.type})`
				}))}
				type="multiple"
				selected={requestedInsulins.map((insulin) => insulin.code)}
				placeholder="Selecione as insulinas"
				onSelect={handleSelectInsulins}
			/>
		</label>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div class="text-sm text-gray-500">
			Exibindo {totals.filtered} de {totals.data} locais
		</div>

		<div class="flex space-x-2">
			<UiButton variant={isOrderByNearest ? 'primary' : 'ghost'} onClick={handleOrderByNearest}>
				<div class="flex items-center">
					{#if location.isLoading}
						<div
							class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
					{:else}
						<LocationIcon class="h-4 w-4" />
					{/if}
				</div>
			</UiButton>
			<UiButton variant="secondary" onClick={handleClearFilters}>Limpar Filtros</UiButton>
		</div>
	</div>
</div>
