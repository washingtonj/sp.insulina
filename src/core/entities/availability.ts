import type { InsulinEntity } from './insulin';

export interface AvailabilityEntity {
	insulin: InsulinEntity;
	quantity: number;
	level: 1 | 2 | 3;
}
