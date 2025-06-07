import { PickupEntity } from "$core/entities/pickup";

export interface PickupRepository {
  addPickups(pickups: PickupEntity[]): Promise<void>;
  updateAvailabilities(pickups: PickupEntity[]): Promise<void>;
  getAllPickups(): Promise<PickupEntity[]>;
}
