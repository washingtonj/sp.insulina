import { API_URL } from './api';

export type PickupBestDay = {
	dayOfMonth: number;
	averageUnits: number;
	samples: number;
};

export type BestDayProfile = Record<string, PickupBestDay>;

export function bestDayLabel(dayOfMonth: number | undefined): string | undefined {
	if (dayOfMonth === undefined || dayOfMonth < 1 || dayOfMonth > 31) return undefined;

	return String(dayOfMonth);
}

export async function fetchBestDayProfile(days = 90): Promise<BestDayProfile> {
	const response = await fetch(`${API_URL}/pickups/best-days?days=${days}`);
	if (!response.ok) throw new Error(`GET /pickups/best-days respondeu ${response.status}`);

	return response.json();
}
