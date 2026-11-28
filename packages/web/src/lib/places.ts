import { haversineDistanceKm } from './utils/distance';

export type InsulinType = 'REFILL' | 'CANETA' | 'AMPOLA';
export type InsulinVariant = 'NPH' | 'REGULAR';

export type Insulin = {
	id: number;
	code: string;
	name: string;
	simpleName: string;
	type: InsulinType;
	variant: InsulinVariant;
};

export type Availability = {
	insulin: Insulin;
	quantity: number;
	level: 1 | 2 | 3;
};

export type Place = {
	id: string;
	name: string;
	address: { address: string; latitude: number; longitude: number };
	availability: Availability[];
	businessHourTags: string[];
	is24HoursOpen: boolean;
	isWeekendOpen: boolean;
	checkedAt?: string;
	distance?: number;
};

export type Coordinates = { latitude: number; longitude: number };

export type Filters = {
	variants: InsulinVariant[];
	types: InsulinType[];
	is24Hours: boolean;
	isWeekendOpen: boolean;
	maxDistance: number | null;
};

export const NO_FILTERS: Filters = {
	variants: [],
	types: [],
	is24Hours: false,
	isWeekendOpen: false,
	maxDistance: null
};

export const FORMAT_LABELS: Record<InsulinType, string> = {
	REFILL: 'Carpule',
	CANETA: 'Caneta',
	AMPOLA: 'Ampola'
};

/** Caneta saiu de distribuição: some da interface e das regras de filtro. */
export const VISIBLE_FORMATS: InsulinType[] = ['REFILL', 'AMPOLA'];

const FORMATS: { label: string; type: InsulinType }[] = VISIBLE_FORMATS.map((type) => ({
	label: FORMAT_LABELS[type],
	type
}));

export type FormatStock = {
	label: string;
	nph: number;
	regular: number;
	hasStock: boolean;
};

export function summarizeAvailability(availability: Availability[]): FormatStock[] {
	return FORMATS.map(({ label, type }) => {
		const ofType = availability.filter((item) => item.insulin.type === type);
		const nph = quantityOf(ofType, 'NPH');
		const regular = quantityOf(ofType, 'REGULAR');

		return { label, nph, regular, hasStock: nph > 0 || regular > 0 };
	});
}

function quantityOf(availability: Availability[], variant: InsulinVariant): number {
	return availability
		.filter((item) => item.insulin.variant === variant)
		.reduce((total, item) => total + item.quantity, 0);
}

export function hasStock(place: Place): boolean {
	return place.availability.some((item) => item.quantity > 0);
}

export function totalUnits(place: Place): number {
	return place.availability.reduce((total, item) => total + item.quantity, 0);
}

export function withDistance(place: Place, origin: Coordinates): Place {
	return {
		...place,
		distance: haversineDistanceKm(
			origin.latitude,
			origin.longitude,
			place.address.latitude,
			place.address.longitude
		)
	};
}

export function businessHourLabel(tags: string[]): string {
	return tags[0] ?? 'Horário não informado';
}

export function activeFilterCount(filters: Filters): number {
	return (
		filters.variants.length +
		filters.types.length +
		Number(filters.is24Hours) +
		Number(filters.isWeekendOpen) +
		Number(filters.maxDistance !== null)
	);
}

function matchesText(place: Place, query: string): boolean {
	return (
		place.name.toLowerCase().includes(query) || place.address.address.toLowerCase().includes(query)
	);
}

function matchesInsulin(filters: Filters, place: Place): boolean {
	const { variants } = filters;
	const visibleTypes = filters.types.filter((type) => VISIBLE_FORMATS.includes(type));
	const stocked = (item: Availability) =>
		item.quantity > 0 && VISIBLE_FORMATS.includes(item.insulin.type);
	if (variants.length === 0 && visibleTypes.length === 0) return true;

	if (variants.length > 0 && visibleTypes.length > 0) {
		return variants.every((variant) =>
			visibleTypes.some((type) =>
				place.availability.some(
					(item) => stocked(item) && item.insulin.variant === variant && item.insulin.type === type
				)
			)
		);
	}

	if (variants.length > 0) {
		return variants.every((variant) =>
			place.availability.some((item) => stocked(item) && item.insulin.variant === variant)
		);
	}

	return visibleTypes.some((type) =>
		place.availability.some((item) => stocked(item) && item.insulin.type === type)
	);
}

function matchesAvailability(filters: Filters, place: Place): boolean {
	if (!filters.is24Hours && !filters.isWeekendOpen) return true;
	if (filters.is24Hours && filters.isWeekendOpen) {
		return place.is24HoursOpen || place.isWeekendOpen;
	}

	return filters.is24Hours ? place.is24HoursOpen : place.isWeekendOpen;
}

const AVAILABILITY_WEIGHT = 0.3;
const DISTANCE_WEIGHT = 0.7;
const SECONDARY_VARIANT_FACTOR = 0.4;

export function sortPlaces(places: Place[], selectedVariants: InsulinVariant[]): Place[] {
	if (places.length === 0) return places;

	const onlyVariant = selectedVariants.length === 1 ? selectedVariants[0] : null;
	const weightOf = (variant: InsulinVariant) => {
		if (onlyVariant === null || onlyVariant === variant) return 1;
		return SECONDARY_VARIANT_FACTOR;
	};

	let maxAvailability = 0;
	const scored = places.map((place) => {
		const availability =
			quantityOf(place.availability, 'NPH') * weightOf('NPH') +
			quantityOf(place.availability, 'REGULAR') * weightOf('REGULAR');

		if (availability > maxAvailability) maxAvailability = availability;

		return {
			place,
			availability,
			distanceScore: place.distance != null ? 1 / (1 + place.distance) : 0.5
		};
	});

	const scale = maxAvailability || 1;

	return scored
		.map(({ place, availability, distanceScore }) => ({
			place,
			score: AVAILABILITY_WEIGHT * (availability / scale) + DISTANCE_WEIGHT * distanceScore
		}))
		.sort(
			(a, b) => b.score - a.score || (a.place.distance ?? Infinity) - (b.place.distance ?? Infinity)
		)
		.map(({ place }) => place);
}

type Query = { filters: Filters; search: string };

export function selectPlaces(places: Place[], { filters, search }: Query): Place[] {
	const query = search.trim().toLowerCase();

	const matching = places.filter((place) => {
		if (query && !matchesText(place, query)) return false;
		if (!matchesInsulin(filters, place)) return false;
		if (!matchesAvailability(filters, place)) return false;
		if (
			filters.maxDistance !== null &&
			place.distance !== undefined &&
			place.distance > filters.maxDistance
		) {
			return false;
		}

		return true;
	});

	return sortPlaces(matching, filters.variants);
}
