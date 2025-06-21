import { type PickupRepository } from "domain/interfaces/pickup-repository";

type Adapters = {
  pickupRepository: PickupRepository;
};

export async function getAllAvailabilities({ pickupRepository }: Adapters) {
  const LAST_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

  const availabilities = await pickupRepository.getAvailabilities({
    startDate: new Date(Date.now() - LAST_WEEK_IN_MS), // Last 7 days
    endDate: new Date(),
  });

  return availabilities;
}
