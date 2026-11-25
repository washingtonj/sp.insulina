import { log } from "../../telemetry/log.ts";
import { traceSpan } from "../../telemetry/spans.ts";
import { PickupEntity } from "../entities/index.ts";
import type { PickupRepository } from "../interfaces/pickup-repository.ts";
import type { PickupService } from "../interfaces/pickup-service.ts";

type Adapters = {
  pickupRepository: PickupRepository;
  pickupService: PickupService;
};

export async function updateAvailability({
  pickupRepository,
  pickupService,
}: Adapters) {
  return traceSpan("availability.sync", {}, async (span) => {
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
          log("warn", "pickup_name_conflict", {
            name: newPickup.name,
            new: {
              address: newPickup.address,
              businessHours: newPickup.businessHours,
            },
            existing: {
              address: pickupWithSameName.address,
              businessHours: pickupWithSameName.businessHours,
            },
          });
          return false;
        }

        return true;
      });

      if (pickupsToAdd.length) {
        await pickupRepository.addPickups(pickupsToAdd);
        log("info", "pickups_added", { count: pickupsToAdd.length });
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
    const pickupsOpenNow = pickupsWithId.filter((pickup) =>
      pickup.isOpenNow(),
    );
    await pickupRepository.updateAvailabilities(pickupsOpenNow);

    span.setAttribute("sync.pickups_updated", pickupsOpenNow.length);
    log("info", "availabilities_updated", {
      count: pickupsOpenNow.length,
    });
  });
}
