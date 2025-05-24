export class AddressEntity {
	public address!: string;
	public latitude!: number;
	public longitude!: number;

	constructor(data: AddressEntity) {
		Object.assign(this, data);
	}
}
