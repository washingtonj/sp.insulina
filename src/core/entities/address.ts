import { calcDistance } from '$core/utils/distance';

export interface AddressEntity {
	address: string;
	latitude: number;
	longitude: number;
	distance?: number;
}

export function addDistance(
	data: AddressEntity,
	location: { lat: number; lng: number }
): AddressEntity {
	const lat = data.latitude;
	const lng = data.longitude;

	let distance: number | undefined;

	if (
		typeof lat === 'number' &&
		typeof lng === 'number' &&
		!isNaN(lat) &&
		!isNaN(lng) &&
		!isNaN(location.lat) &&
		!isNaN(location.lng)
	) {
		distance = calcDistance(location.lat, location.lng, lat, lng);

		// Validate the calculated distance
		if (isNaN(distance) || !isFinite(distance)) {
			distance = undefined;
		} else {
			// Round to 1 decimal place for better UX
			distance = Math.round(distance * 10) / 10;
		}
	}

	return {
		...data,
		distance
	};
}
