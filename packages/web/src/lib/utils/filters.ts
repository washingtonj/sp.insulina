import type { InsulinEntity } from '@sp-insulina/core/entities/insulin';
import type { PickupEntity } from '@sp-insulina/core/entities/pickup';
import { has24hService, hasWeekendService } from '@sp-insulina/core/entities/businessHour';

export function filterByInsulinCodes(
	data: PickupEntity[],
	insulinCodes: string[] | null
): PickupEntity[] {
	if (!insulinCodes || insulinCodes.length === 0) return data;

	return data.filter((item) =>
		insulinCodes.every((code) =>
			item.availability.some((q) => q.insulin.code === code && q.quantity > 0)
		)
	);
}

export function filterBySearchQuery(
	data: PickupEntity[],
	searchQuery: string | null
): PickupEntity[] {
	if (!searchQuery) return data;

	const query = searchQuery.trim().toLowerCase();
	if (!query) return data;

	return data.filter((item) => {
		const name = item.name?.toLowerCase() || '';
		const address = item.address?.address?.toLowerCase() || '';
		return name.includes(query) || address.includes(query);
	});
}

export function filterBy24hService(data: PickupEntity[], is24hOnly: boolean): PickupEntity[] {
	if (!is24hOnly) return data;

	return data.filter((item) => has24hService(item.businessHours));
}

export function filterByWeekendService(
	data: PickupEntity[],
	isWeekendOnly: boolean
): PickupEntity[] {
	if (!isWeekendOnly) return data;

	return data.filter((item) => hasWeekendService(item.businessHours));
}

export function applyFilters(
	data: PickupEntity[],
	filters: {
		requestedInsulins?: InsulinEntity[];
		searchQuery?: string;
		is24hOnly?: boolean;
		isWeekendOnly?: boolean;
	}
): PickupEntity[] {
	let filtered = [...data];

	if (filters.requestedInsulins && filters.requestedInsulins.length > 0) {
		const insulinCodes = filters.requestedInsulins.map((insulin) => insulin.code);
		filtered = filterByInsulinCodes(filtered, insulinCodes);
	}

	if (filters.searchQuery) {
		filtered = filterBySearchQuery(filtered, filters.searchQuery);
	}

	if (filters.is24hOnly) {
		filtered = filterBy24hService(filtered, filters.is24hOnly);
	}

	if (filters.isWeekendOnly) {
		filtered = filterByWeekendService(filtered, filters.isWeekendOnly);
	}

	return filtered;
}
