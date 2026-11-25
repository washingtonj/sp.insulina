import type { PickupRepository } from "../interfaces/pickup-repository.ts";

type Adapters = {
  pickupRepository: PickupRepository;
};

export async function getAllPickups({ pickupRepository }: Adapters) {
  return pickupRepository.getAllPickups();
}
