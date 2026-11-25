import { describe, expect, it } from 'vitest';
import { stockLevel } from './stock-level';
import type { Availability, Place } from './places';

function stock(
	type: 'REFILL' | 'CANETA' | 'AMPOLA',
	variant: 'NPH' | 'REGULAR',
	quantity: number
): Availability {
	return {
		insulin: { id: 1, code: `${type}-${variant}`, name: type, simpleName: type, type, variant },
		quantity,
		level: 3
	};
}

const COMPLETE = [
	stock('REFILL', 'NPH', 10),
	stock('REFILL', 'REGULAR', 10),
	stock('AMPOLA', 'NPH', 10),
	stock('AMPOLA', 'REGULAR', 10)
];

function place(availability: Availability[]): Place {
	return {
		id: 'p1',
		name: 'UBS',
		address: { address: 'Rua A', latitude: 0, longitude: 0 },
		availability,
		businessHourTags: [],
		is24HoursOpen: false,
		isWeekendOpen: false
	};
}

describe('stockLevel', () => {
	it('is complete when every visible item has stock', () => {
		expect(stockLevel(place(COMPLETE))).toBe(3);
	});

	it('drops one level when a single item is missing', () => {
		const missingAmpolaNph = COMPLETE.filter(
			(item) => !(item.insulin.type === 'AMPOLA' && item.insulin.variant === 'NPH')
		);

		expect(stockLevel(place(missingAmpolaNph))).toBe(2);
	});

	it('is partial when several items are missing', () => {
		const onlyCarpule = COMPLETE.filter((item) => item.insulin.type === 'REFILL');

		expect(stockLevel(place(onlyCarpule))).toBe(1);
	});

	it('is empty when nothing has stock', () => {
		expect(stockLevel(place([]))).toBe(0);
		expect(stockLevel(place([stock('REFILL', 'NPH', 0)]))).toBe(0);
	});

	it('counts a zeroed item as missing', () => {
		const zeroed = COMPLETE.map((item) =>
			item.insulin.type === 'AMPOLA' && item.insulin.variant === 'NPH'
				? stock('AMPOLA', 'NPH', 0)
				: item
		);

		expect(stockLevel(place(zeroed))).toBe(2);
	});

	it('uses only the filtered variant', () => {
		const regularIncomplete = [stock('REFILL', 'REGULAR', 10), stock('AMPOLA', 'REGULAR', 0)];

		expect(stockLevel(place(regularIncomplete), { variants: ['REGULAR'] })).toBe(2);
	});

	it('uses only the filtered format', () => {
		expect(stockLevel(place([stock('AMPOLA', 'NPH', 10)]), { types: ['AMPOLA'] })).toBe(2);
	});

	it('ignores discontinued formats', () => {
		expect(stockLevel(place([stock('CANETA', 'NPH', 50)]))).toBe(0);
	});
});
