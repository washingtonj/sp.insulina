import { PickupRepository } from "$core/interfaces/pickup-repository";

type Adapters = {
  pickupRepository: PickupRepository;
};

export async function getAllPickups({ pickupRepository }: Adapters) {
  return pickupRepository.getAllPickups();
}
