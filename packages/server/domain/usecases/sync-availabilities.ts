import { PickupEntity } from "domain/entities/pickup";
import { PickupRepository } from "domain/interfaces/pickup-repository";
import { PickupService } from "domain/interfaces/pickup-service";

type Adapters = {
  pickupRepository: PickupRepository;
  pickupService: PickupService;
};

// Helper to compare pickups by name and address
function isSamePickup(
  a: { name: string; address: { address: string } },
  b: { name: string; address: { address: string } },
) {
  return a.name === b.name && a.address.address === b.address.address;
}

export async function updateAvailability({
  pickupRepository,
  pickupService,
}: Adapters) {
  const [fromService, fromRepository] = await Promise.all([
    pickupService.getPickupsAvailabilities(),
    pickupRepository.getAllPickups(),
  ]);

  const newPickups = fromService.filter(
    (servicePickup) =>
      !fromRepository.some((repoPickup) =>
        isSamePickup(repoPickup, servicePickup),
      ),
  );

  if (newPickups.length) {
    await pickupRepository.addPickups(newPickups);
    console.log(
      `Added ${newPickups.length} new pickups from service to repository.`,
    );
  }

  const pickupsWithId: PickupEntity[] = fromService
    .map((servicePickup) => {
      const repoPickup = fromRepository.find((repoPickup) =>
        isSamePickup(repoPickup, servicePickup),
      );
      if (repoPickup) {
        return { ...servicePickup, id: repoPickup.id };
      }
    })
    .filter((pickup) => pickup !== undefined);

  await pickupRepository.updateAvailabilities(pickupsWithId);
}
