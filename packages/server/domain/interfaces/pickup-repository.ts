import { PickupEntity } from "domain/entities/pickup";

export interface PickupRepository {
  addPickups(pickups: PickupEntity[]): Promise<void>;
  updateAvailabilities(pickups: PickupEntity[]): Promise<void>;
  getAllPickups(): Promise<PickupEntity[]>;
}
