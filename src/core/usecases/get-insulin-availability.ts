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

		// Sort by the number of insulin types at level 3 (descending),
		// then by the total quantity of insulin available (all levels, descending)
		availability.sort((a, b) => {
			const aLevel3Types = a.quantity.filter((q) => q.level === 3);
			const bLevel3Types = b.quantity.filter((q) => q.level === 3);

			const aLevel3Count = aLevel3Types.length;
			const bLevel3Count = bLevel3Types.length;

			if (bLevel3Count !== aLevel3Count) {
				return bLevel3Count - aLevel3Count;
			}

			const aTotalQuantity = a.quantity.reduce((sum, q) => sum + (q.quantity ?? 0), 0);
			const bTotalQuantity = b.quantity.reduce((sum, q) => sum + (q.quantity ?? 0), 0);

			return bTotalQuantity - aTotalQuantity;
		});

		return availability;
	}
}
