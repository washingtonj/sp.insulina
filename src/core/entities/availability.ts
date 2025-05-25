import type { InsulinEntity } from './insulin';
import type { PickupPointEntity } from './pickup-point';

export class AvailabilityEntity {
	pickup!: PickupPointEntity;
	quantity!: {
		insulin: InsulinEntity;
		quantity: number;
		level: 1 | 2 | 3;
	}[];

	constructor(data: AvailabilityEntity) {
		Object.assign(this, data);
	}
}
