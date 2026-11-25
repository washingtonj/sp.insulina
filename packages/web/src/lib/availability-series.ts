import { API_URL } from './api';
import type { InsulinType, InsulinVariant } from './places';

export type SeriesPoint = {
	day: string;
	pickupsWithStock: number;
	totalQuantity: number;
	pickupsReported: number;
};

export type AvailabilitySeriesEntry = {
	type: InsulinType;
	variant: InsulinVariant;
	points: SeriesPoint[];
};

export type AvailabilitySeries = {
	days: string[];
	series: AvailabilitySeriesEntry[];
};

export type ChartSeries = {
	key: string;
	label: string;
	color: string;
	values: (number | null)[];
};

export type Metric = 'pickups' | 'quantity';

export const METRIC_VALUE: Record<Metric, (point: SeriesPoint) => number> = {
	pickups: (point) => point.pickupsWithStock,
	quantity: (point) => point.totalQuantity
};

export type ChartRow = { date: Date } & Record<string, number | null | Date>;

export function seriesKey(entry: Pick<AvailabilitySeriesEntry, 'type' | 'variant'>): string {
	return `${entry.type}:${entry.variant}`;
}

export function toChartRows(
	days: string[],
	entries: AvailabilitySeriesEntry[],
	metric: Metric
): ChartRow[] {
	return days.map((day) => {
		const row: ChartRow = { date: new Date(`${day}T12:00:00.000Z`) };

		for (const entry of entries) {
			const point = entry.points.find((candidate) => candidate.day === day);
			row[seriesKey(entry)] = point ? METRIC_VALUE[metric](point) : null;
		}

		return row;
	});
}

export function valuesOf(rows: ChartRow[], key: string): (number | null)[] {
	return rows.map((row) => {
		const value = row[key];
		return typeof value === 'number' ? value : null;
	});
}

export function deltaAt(values: (number | null)[], index: number): number | null {
	if (index === 0) return null;

	const current = values[index];
	const previous = values[index - 1];
	if (current === null || previous === null) return null;

	return current - previous;
}

export async function fetchAvailabilitySeries(
	days: number,
	pickupId?: string
): Promise<AvailabilitySeries> {
	const path = pickupId
		? `/pickups/${pickupId}/availabilities?days=${days}`
		: `/availabilities/series?days=${days}`;

	const response = await fetch(`${API_URL}${path}`);
	if (!response.ok) throw new Error(`GET ${path} respondeu ${response.status}`);

	return response.json();
}
