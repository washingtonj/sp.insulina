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
    // Filter out new pickups that have the same name as an existing pickup in the repository.
    const pickupsToAdd = newPickups.filter((newPickup) => {
      const pickupWithSameName = fromRepository.find(
        (repoPickup) => repoPickup.name === newPickup.name,
      );

      if (pickupWithSameName) {
        console.log(
          `The pickup "${newPickup.name}" have the same name as an existing pickup in the repository. Skipping it!`,
          {
            new: {
              name: newPickup.name,
              address: newPickup.address,
              businessHours: newPickup.businessHours,
            },
            existing: {
              name: pickupWithSameName.name,
              address: pickupWithSameName.address,
              businessHours: pickupWithSameName.businessHours,
            },
          },
        );
        return false;
      }

      return true;
    });

    if (pickupsToAdd.length) {
      await pickupRepository.addPickups(pickupsToAdd);
      console.log(
        `Added ${pickupsToAdd.length} new pickups from service to repository.`,
      );
    }
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
  await pickupRepository.updateAvailabilities(pickupsOpenNow);
  console.log(`Updated availabilities for ${pickupsOpenNow.length} pickups.`);
}
