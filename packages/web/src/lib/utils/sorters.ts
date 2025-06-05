import type { AvailabilityEntity } from '@sp-insulina/core/entities/availability';
import type { PickupEntity } from '@sp-insulina/core/entities/pickup';
import type { InsulinEntity } from '@sp-insulina/core/entities/insulin';

/**
 * Sorts pickups by balancing distance (when available), insulin levels and quantities.
 * Prioritizes requested insulins when available.
 * Returns the most relevant pickups first based on a scoring system.
 */
export function applySorters(
	data: PickupEntity[],
	requestedInsulins: InsulinEntity[] = []
): PickupEntity[] {
	return [...data].sort((a, b) => {
		// Score based on insulin levels and quantities (0-100)
		const getInsulinScore = (availability: AvailabilityEntity[], requestedCodes: string[] = []) => {
			// If we have requested insulins, only consider those
			const relevantAvailability =
				requestedCodes.length > 0
					? availability.filter((a) => requestedCodes.includes(a.insulin.code))
					: availability;

			if (relevantAvailability.length === 0) return 0;

			const totalQuantity = relevantAvailability.reduce((acc, q) => acc + q.quantity, 0);
			const level3Count = relevantAvailability.filter((q) => q.level === 3).length;
			const maxLevel = Math.max(...relevantAvailability.map((q) => q.level));

			// Score components:
			// - Level 3 count (40%): Most important for critical needs
			// - Coverage (20%): How many of the requested insulins are available
			// - Max level (20%): Highest insulin level available
			// - Quantity (20%): Total quantity available
			const level3Score = Math.min(level3Count / 2, 1) * 40; // Cap at 2 level 3 items
			const coverageScore =
				requestedCodes.length > 0 ? (relevantAvailability.length / requestedCodes.length) * 20 : 20;
			const levelScore = (maxLevel / 3) * 20;
			const quantityScore = Math.min(totalQuantity / 20, 1) * 20; // Cap at 20 units

			return level3Score + coverageScore + levelScore + quantityScore;
		};

		const requestedCodes = requestedInsulins.map((insulin) => insulin.code);

		// Calculate base scores from insulin availability
		const aInsulinScore = getInsulinScore(a.availability, requestedCodes);
		const bInsulinScore = getInsulinScore(b.availability, requestedCodes);

		// If both addresses have distance, include it in scoring
		if (a.address.distance != null && b.address.distance != null) {
			// Distance score (0-100, lower distance = higher score)
			const getDistanceScore = (distance: number) => Math.max(0, 100 - distance * 2);

			const aDistanceScore = getDistanceScore(a.address.distance);
			const bDistanceScore = getDistanceScore(b.address.distance);

			// Combined score (distance 20%, insulin 80%)
			// Give more weight to insulin score to prefer well-stocked locations
			const aScore = aDistanceScore * 0.2 + aInsulinScore * 0.8;
			const bScore = bDistanceScore * 0.2 + bInsulinScore * 0.8;

			return bScore - aScore;
		}

		// If no distance available, sort by insulin score only
		return bInsulinScore - aInsulinScore;
	});
}

export function TypeAndNameSorter(a: InsulinEntity, b: InsulinEntity) {
	if (a.type !== b.type) {
		return a.type.localeCompare(b.type);
	}

	return a.simpleName.localeCompare(b.simpleName);
}
