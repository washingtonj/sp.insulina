import type { InsulinEntity } from '$core/entities/insulin';
import type { PickupEntity } from '$core/entities/pickup';

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

export function applyFilters(
	data: PickupEntity[],
	filters: {
		requestedInsulins?: InsulinEntity[];
		searchQuery?: string;
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

	return filtered;
}
