export class InsulinEntity {
	code!: string;
	fullName!: string;
	type!: 'AMPOLA' | 'CANETA' | 'REFILL';
	simpleName!: string;

	constructor(data: InsulinEntity) {
		Object.assign(this, data);
	}
}
