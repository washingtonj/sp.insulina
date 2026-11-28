<script lang="ts">
	import {
		FORMAT_LABELS,
		VISIBLE_FORMATS,
		type Filters,
		type InsulinType,
		type InsulinVariant
	} from '$lib/places';
	import FilterCheckbox from './filter-checkbox.svelte';
	import FilterSection from './filter-section.svelte';

	type Props = {
		values: Filters;
		hasLocation: boolean;
		idPrefix?: string;
		onchange: (values: Filters) => void;
	};

	let { values, hasLocation, idPrefix = '', onchange }: Props = $props();

	const VARIANTS = [
		{ value: 'NPH', label: 'NPH' },
		{ value: 'REGULAR', label: 'Regular' }
	] as const;

	const TYPES = VISIBLE_FORMATS.map((type) => ({ value: type, label: FORMAT_LABELS[type] }));

	function toggle<T>(list: T[], value: T): T[] {
		return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
	}

	function setVariant(value: string) {
		onchange({
			...values,
			variants: toggle<InsulinVariant>(values.variants, value as InsulinVariant)
		});
	}

	function setType(value: string) {
		onchange({ ...values, types: toggle<InsulinType>(values.types, value as InsulinType) });
	}

	function setMaxDistance(event: Event & { currentTarget: HTMLInputElement }) {
		onchange({ ...values, maxDistance: Number(event.currentTarget.value) });
	}
</script>

<FilterSection
	title="Tipo de Insulina"
	options={VARIANTS}
	selected={values.variants}
	{idPrefix}
	ontoggle={setVariant}
/>

<FilterSection
	title="Formato"
	options={TYPES}
	selected={values.types}
	{idPrefix}
	ontoggle={setType}
/>

<div>
	<h4 class="text-footnote text-muted font-medium">Disponibilidade</h4>
	<div>
		<FilterCheckbox
			id={`${idPrefix}24hours`}
			label="Aberto 24 horas"
			checked={values.is24Hours}
			onchange={() => onchange({ ...values, is24Hours: !values.is24Hours })}
		/>
		<FilterCheckbox
			id={`${idPrefix}weekend`}
			label="Abre fins de semana"
			checked={values.isWeekendOpen}
			onchange={() => onchange({ ...values, isWeekendOpen: !values.isWeekendOpen })}
		/>
	</div>
</div>

<div>
	<h4 class="text-footnote text-muted mb-3 font-medium">Distância Máxima</h4>
	<input
		type="range"
		min="1"
		max="30"
		step="1"
		class="[&::-webkit-slider-runnable-track]:bg-line [&::-webkit-slider-thumb]:bg-ink [&::-moz-range-track]:bg-line [&::-moz-range-thumb]:bg-ink h-11 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-40 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
		aria-label="Filtro de distância máxima"
		value={values.maxDistance ?? 30}
		disabled={!hasLocation}
		oninput={setMaxDistance}
	/>
	<div class="text-muted text-footnote mt-2 flex min-h-11 items-center justify-between gap-3">
		<span>
			{#if !hasLocation}
				Ative sua localização
			{:else if values.maxDistance === null}
				Sem limite
			{:else}
				Até {values.maxDistance} km
			{/if}
		</span>
		{#if hasLocation && values.maxDistance !== null}
			<button
				type="button"
				class="hover:text-ink flex min-h-11 items-center font-medium underline"
				onclick={() => onchange({ ...values, maxDistance: null })}
			>
				Sem limite
			</button>
		{/if}
	</div>
</div>
