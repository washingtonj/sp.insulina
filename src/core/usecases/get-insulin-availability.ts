import { ESaudeService } from '../services/e-saude';
import type { AddressEntity } from '../entities/address';
import type { AvailabilityEntity } from '../entities/availability';

const PRE_DEFINED_CORDINATES: AddressEntity[] = [
	// This address return all São Paulo units
	{
		address: 'Alameda dos Jambos - Recanto Campo Belo, São Paulo - SP',
		latitude: -22.6965292,
		longitude: -46.716467
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

		// Sort by the number of insulin types at level 3 (descending)
		availability.sort((a, b) => {
			const aLevel3 = a.quantity.filter((q) => q.level === 3).length;
			const bLevel3 = b.quantity.filter((q) => q.level === 3).length;
			return bLevel3 - aLevel3;
		});

		return availability;
	}
}
