import type { AddressEntity } from './address';

export class PickupPointEntity {
	placeName!: string;
	address!: AddressEntity;

	constructor(data: PickupPointEntity) {
		Object.assign(this, data);
	}
}
