// Local types for PickupEntity and InsulinEntity
export type InsulinEntity = {
	code: string;
	name: string;
	simpleName: string;
	type: string;
	variant: string;
	id: number;
};

export type AvailabilityEntity = {
	insulin: InsulinEntity;
	quantity: number;
	level: number;
};

export type PickupEntity = {
	id: string;
	name: string;
	address: {
		address: string;
		latitude: number;
		longitude: number;
		distance?: number;
	};
	businessHourTags?: string[];
	businessHours?: any;
	is24HoursOpen?: boolean;
	isWeekendOpen?: boolean;
	availability: AvailabilityEntity[];
};

function has24hService(businessHours: any): boolean {
	return Array.isArray(businessHours) ? businessHours.some((h) => h.is24Hours) : false;
}

function hasWeekendService(businessHours: any): boolean {
	return Array.isArray(businessHours) ? businessHours.some((h) => h.isWeekend) : false;
}

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

import { haversineDistanceKm } from './distance';

/**
 * Applies all filters and calculates distance if user location is provided.
 * Optionally sorts by distance.
 */
export function applyFiltersAndDistance(
	data: PickupEntity[],
	options: {
		requestedInsulins?: InsulinEntity[];
		searchQuery?: string;
		is24hOnly?: boolean;
		isWeekendOnly?: boolean;
		userLocation?: { latitude: number; longitude: number } | null;
		sortByDistance?: boolean;
	}
): PickupEntity[] {
	let filtered = [...data];

	if (options.requestedInsulins && options.requestedInsulins.length > 0) {
		const insulinCodes = options.requestedInsulins.map((insulin) => insulin.code);
		filtered = filterByInsulinCodes(filtered, insulinCodes);
	}

	if (options.searchQuery) {
		filtered = filterBySearchQuery(filtered, options.searchQuery);
	}

	if (options.is24hOnly) {
		filtered = filterBy24hService(filtered, options.is24hOnly);
	}

	if (options.isWeekendOnly) {
		filtered = filterByWeekendService(filtered, options.isWeekendOnly);
	}

	// Calculate distance if user location is provided
	if (options.userLocation) {
		filtered = filtered.map((pickup) => ({
			...pickup,
			address: {
				...pickup.address,
				distance: haversineDistanceKm(
					options.userLocation!.latitude,
					options.userLocation!.longitude,
					pickup.address.latitude,
					pickup.address.longitude
				)
			}
		}));
	}

	// Optionally sort by distance
	if (options.sortByDistance && options.userLocation) {
		filtered = filtered.sort((a, b) => {
			const da = a.address.distance;
			const db = b.address.distance;
			if (da == null && db == null) return 0;
			if (da == null) return 1;
			if (db == null) return -1;
			return da - db;
		});
	}

	return filtered;
}
