import { describe, expect, it } from 'vitest';
import {
	NO_FILTERS,
	activeFilterCount,
	selectPlaces,
	sortPlaces,
	summarizeAvailability,
	type Availability,
	type InsulinType,
	type InsulinVariant,
	type Place
} from './places';

function stock(type: InsulinType, variant: InsulinVariant, quantity: number): Availability {
	return {
		insulin: { id: 1, code: `${type}-${variant}`, name: type, simpleName: type, type, variant },
		quantity,
		level: 1
	};
}

function place(overrides: Partial<Place> = {}): Place {
	return {
		id: 'p1',
		name: 'UBS Centro',
		address: { address: 'Rua A, 10', latitude: 0, longitude: 0 },
		availability: [],
		businessHourTags: [],
		is24HoursOpen: false,
		isWeekendOpen: false,
		...overrides
	};
}

describe('summarizeAvailability', () => {
	it('sums each variant per format', () => {
		const summary = summarizeAvailability([
			stock('REFILL', 'NPH', 10),
			stock('REFILL', 'NPH', 5),
			stock('REFILL', 'REGULAR', 3)
		]);

		expect(summary).toEqual([
			{ label: 'Carpule', nph: 15, regular: 3, hasStock: true },
			{ label: 'Ampola', nph: 0, regular: 0, hasStock: false }
		]);
	});
});

describe('activeFilterCount', () => {
	it('counts selections and toggles', () => {
		expect(activeFilterCount(NO_FILTERS)).toBe(0);
		expect(
			activeFilterCount({ ...NO_FILTERS, variants: ['NPH'], types: ['REFILL'], is24Hours: true })
		).toBe(3);
	});
});

describe('selectPlaces', () => {
	const nearby = place({
		id: 'nearby',
		name: 'UBS Vila Nova',
		availability: [stock('REFILL', 'NPH', 4)]
	});
	const far = place({
		id: 'far',
		name: 'UBS Jardim',
		address: { address: 'Avenida B, 200', latitude: 0, longitude: 0 },
		availability: [stock('CANETA', 'REGULAR', 4)],
		distance: 12
	});

	it('filters by name or address, ignoring case', () => {
		const found = selectPlaces([nearby, far], {
			filters: NO_FILTERS,
			search: 'jardim'
		});

		expect(found.map((item) => item.id)).toEqual(['far']);
	});

	it('keeps places that stock every selected variant', () => {
		const filters = { ...NO_FILTERS, variants: ['NPH' as const] };
		const found = selectPlaces([nearby, far], { filters, search: '' });

		expect(found.map((item) => item.id)).toEqual(['nearby']);
	});

	it('requires every variant and format pair when both are selected', () => {
		const both = place({
			id: 'both',
			availability: [stock('REFILL', 'NPH', 1), stock('AMPOLA', 'REGULAR', 1)]
		});
		const filters = {
			...NO_FILTERS,
			variants: ['NPH' as const, 'REGULAR' as const],
			types: ['REFILL' as const, 'AMPOLA' as const]
		};

		const found = selectPlaces([both, nearby], { filters, search: '' });

		expect(found.map((item) => item.id)).toEqual(['both']);
	});

	it('ignores discontinued formats such as Caneta', () => {
		const canetaOnly = place({ id: 'caneta', availability: [stock('CANETA', 'NPH', 20)] });
		const filters = { ...NO_FILTERS, variants: ['NPH' as const] };

		expect(selectPlaces([canetaOnly], { filters, search: '' })).toEqual([]);
	});

	it('ignores availability with zero quantity', () => {
		const empty = place({ id: 'empty', availability: [stock('REFILL', 'NPH', 0)] });
		const filters = { ...NO_FILTERS, variants: ['NPH' as const] };

		expect(selectPlaces([empty], { filters, search: '' })).toEqual([]);
	});

	it('matches either opening condition when both toggles are active', () => {
		const weekendOnly = place({ id: 'weekend', isWeekendOpen: true });
		const filters = { ...NO_FILTERS, is24Hours: true, isWeekendOpen: true };

		expect(selectPlaces([weekendOnly], { filters, search: '' })).toHaveLength(1);
	});

	it('drops places beyond the maximum distance', () => {
		const filters = { ...NO_FILTERS, maxDistance: 5 };

		expect(selectPlaces([nearby, far], { filters, search: '' })).toEqual([nearby]);
	});
});

describe('sortPlaces', () => {
	it('ranks the best stocked place first at the same distance', () => {
		const low = place({ id: 'low', distance: 2, availability: [stock('REFILL', 'NPH', 1)] });
		const high = place({ id: 'high', distance: 2, availability: [stock('REFILL', 'NPH', 30)] });

		expect(sortPlaces([low, high], []).map((item) => item.id)).toEqual(['high', 'low']);
	});

	it('prefers the closer place when stock is equal', () => {
		const near = place({ id: 'near', distance: 1, availability: [stock('REFILL', 'NPH', 5)] });
		const farAway = place({ id: 'far', distance: 9, availability: [stock('REFILL', 'NPH', 5)] });

		expect(sortPlaces([farAway, near], []).map((item) => item.id)).toEqual(['near', 'far']);
	});
});
