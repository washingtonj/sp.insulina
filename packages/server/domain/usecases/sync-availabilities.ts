import { PickupEntity } from "domain/entities";
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
        repoPickup.isSamePickup(servicePickup),
      ),
  );

  if (newPickups.length) {
    await pickupRepository.addPickups(newPickups);
    console.log(
      `Added ${newPickups.length} new pickups from service to repository.`,
    );
  }

  const pickupsWithId = fromService
    .map((servicePickup) => {
      const repoPickup = fromRepository.find((repoPickup) =>
        repoPickup.isSamePickup(servicePickup),
      );
      if (repoPickup) {
        const { id: _ignored, ...servicePickupData } = servicePickup;
        return new PickupEntity({
          ...servicePickupData,
          id: repoPickup.id,
        });
      }
    })
    .filter((pickup) => pickup !== undefined);

  // Only update pickups that are open now.
  const pickupsOpenNow = pickupsWithId.filter((pickup) => pickup.isOpenNow());
  console.log(
    `Updating availabilities for ${pickupsOpenNow.length} pickups that are open now.`,
  );

  await pickupRepository.updateAvailabilities(pickupsOpenNow);
}
