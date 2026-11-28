import { describe, expect, it } from 'vitest';
import {
	deltaAt,
	toChartRows,
	valuesOf,
	type AvailabilitySeriesEntry
} from './availability-series';

const entry = (
	type: AvailabilitySeriesEntry['type'],
	variant: AvailabilitySeriesEntry['variant'],
	points: AvailabilitySeriesEntry['points']
) => ({ type, variant, points });

const series = [
	entry('REFILL', 'NPH', [
		{ day: '2026-11-23', pickupsWithStock: 10, totalQuantity: 400, pickupsReported: 12 },
		{ day: '2026-11-24', pickupsWithStock: 8, totalQuantity: 320, pickupsReported: 12 }
	])
];

describe('toChartRows', () => {
	it('builds one row per day with the metric value', () => {
		const rows = toChartRows(['2026-11-23', '2026-11-24'], series, 'pickups');

		expect(rows.map((row) => row['REFILL:NPH'])).toEqual([10, 8]);
		expect(rows[0].date).toBeInstanceOf(Date);
	});

	it('leaves a day without reading as null', () => {
		const rows = toChartRows(['2026-11-22', '2026-11-23'], series, 'quantity');

		expect(rows.map((row) => row['REFILL:NPH'])).toEqual([null, 400]);
	});
});

describe('valuesOf', () => {
	it('reads the series column as numbers or null', () => {
		const rows = toChartRows(['2026-11-22', '2026-11-23'], series, 'pickups');

		expect(valuesOf(rows, 'REFILL:NPH')).toEqual([null, 10]);
	});
});

describe('deltaAt', () => {
	it('compares with the previous day and ignores gaps', () => {
		expect(deltaAt([10, 8, null, 20], 1)).toBe(-2);
		expect(deltaAt([10, 8, null, 20], 0)).toBeNull();
		expect(deltaAt([10, 8, null, 20], 2)).toBeNull();
		expect(deltaAt([10, 8, null, 20], 3)).toBeNull();
	});
});
