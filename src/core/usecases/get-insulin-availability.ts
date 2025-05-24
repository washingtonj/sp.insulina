import { ESaudeService } from '../services/e-saude';
import type { AddressEntity } from '../entities/address';
import type { AvailabilityEntity } from '../entities/availability';

const PRE_DEFINED_CORDINATES: AddressEntity[] = [
	{
		address: 'Av. Nordestina, 4451 - Vila Nova Curuca, São Paulo - SP, 08032-000, Brazil',
		latitude: -23.51787483496951,
		longitude: -46.42170725543547
	}
];

export class GetInsulinAvailability {
	private eSaudeService: ESaudeService;

	constructor() {
		this.eSaudeService = new ESaudeService();
	}

	async execute() {
		const insulins = this.eSaudeService.getInsulinsInfo();
		let availability: AvailabilityEntity[] = [];

		for await (const address of PRE_DEFINED_CORDINATES) {
			const response = await this.eSaudeService.getAvailability(insulins, address);
			availability = availability.concat(response);
		}

		return availability;
	}
}
