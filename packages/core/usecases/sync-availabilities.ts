import { PickupRepository } from "$core/interfaces/pickup-repository";
import { PickupService } from "$core/interfaces/pickup-service";

type Adapters = {
  pickupRepository: PickupRepository;
  pickupService: PickupService;
};

export async function updateAvailability({
  pickupRepository,
  pickupService,
}: Adapters) {
  const pickups = await pickupService.getPickupsAvailabilities();
  await pickupRepository.syncNewAvailabilities(pickups);
  return pickups;
}
