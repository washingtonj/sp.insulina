import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetInsulinAvailability } from './get-insulin-availability';
import { ESaudeService } from '../services/e-saude';
import type { InsulinEntity } from '../entities/insulin';
import type { AvailabilityEntity } from '../entities/availability';

const mockInsulins: InsulinEntity[] = [
	{ code: '1', fullName: 'Insulin A', type: 'AMPOLA', simpleName: 'Insulin' },
	{ code: '2', fullName: 'Insulin B', type: 'CANETA', simpleName: 'Insulin - Inject' }
];

function createAvailability(pickupName: string, levels: (1 | 2 | 3)[]): AvailabilityEntity {
	return {
		pickup: { placeName: pickupName, address: { address: pickupName, latitude: 0, longitude: 0 } },
		quantity: levels.map((level, idx) => ({
			insulin: mockInsulins[idx % mockInsulins.length],
			quantity: 10,
			level
		}))
	} as AvailabilityEntity;
}

describe('GetInsulinAvailability', () => {
	let getInsulinAvailability: GetInsulinAvailability;
	let getInsulinsInfoSpy: ReturnType<typeof vi.spyOn>;
	let getAvailabilitySpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		getInsulinsInfoSpy = vi
			.spyOn(ESaudeService.prototype, 'getInsulinsInfo')
			.mockReturnValue(mockInsulins);
		getAvailabilitySpy = vi.spyOn(ESaudeService.prototype, 'getAvailability');
		getInsulinAvailability = new GetInsulinAvailability();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return availability sorted by number of level 3 insulins (descending)', async () => {
		const availabilities = [
			createAvailability('Pickup 1', [3, 3]), // 2 at level 3
			createAvailability('Pickup 2', [2, 3]), // 1 at level 3
			createAvailability('Pickup 3', [1, 2]) // 0 at level 3
		];

		getAvailabilitySpy.mockImplementation(async () => availabilities);

		const result = await getInsulinAvailability.execute();

		expect(result).toHaveLength(3);
		const level3Counts = result.map((a) => a.quantity.filter((q) => q.level === 3).length);
		expect(level3Counts).toEqual([2, 1, 0]);
		expect(result[0].pickup.placeName).toBe('Pickup 1');
		expect(result[1].pickup.placeName).toBe('Pickup 2');
		expect(result[2].pickup.placeName).toBe('Pickup 3');
	});

	it('should handle ties in level 3 count and preserve order otherwise', async () => {
		const availabilities = [
			createAvailability('Pickup 1', [3, 2]), // 1 at level 3
			createAvailability('Pickup 2', [3, 2]), // 1 at level 3
			createAvailability('Pickup 3', [2, 2]) // 0 at level 3
		];

		getAvailabilitySpy.mockImplementation(async () => availabilities);

		const result = await getInsulinAvailability.execute();

		expect(result[0].pickup.placeName).toBe('Pickup 1');
		expect(result[1].pickup.placeName).toBe('Pickup 2');
		expect(result[2].pickup.placeName).toBe('Pickup 3');
	});

	it('should return an empty array if no availability is found', async () => {
		getAvailabilitySpy.mockImplementation(async () => []);
		const result = await getInsulinAvailability.execute();
		expect(result).toEqual([]);
	});

	it('should call ESaudeService.getInsulinsInfo and getAvailability for each address', async () => {
		const availabilities = [createAvailability('Pickup 1', [3, 2])];
		getAvailabilitySpy.mockImplementation(async () => availabilities);

		await getInsulinAvailability.execute();

		expect(getInsulinsInfoSpy).toHaveBeenCalledTimes(1);
		expect(getAvailabilitySpy).toHaveBeenCalled();
	});
});
