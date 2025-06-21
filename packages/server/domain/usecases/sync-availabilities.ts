import {
  type PickupEntity,
  isSamePickup,
  isOpenNow,
} from "domain/entities/pickup";
import type { PickupRepository } from "domain/interfaces/pickup-repository";
import type { PickupService } from "domain/interfaces/pickup-service";

type Adapters = {
  pickupRepository: PickupRepository;
  pickupService: PickupService;
};

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

  // Only update pickups that are open now.
  const pickupsOpenNow = pickupsWithId.filter((pickup) => isOpenNow(pickup));
  await pickupRepository.updateAvailabilities(pickupsOpenNow);
}
