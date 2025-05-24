export class InsulinEntity {
	code!: string;
	name!: string;

	constructor(data: InsulinEntity) {
		Object.assign(this, data);
	}
}
