import { InsulinEntity } from "$core/entities/insulin";
import { PickupEntity } from "$core/entities/pickup";

export interface PickupRepository {
  syncNewAvailabilities(pickups: PickupEntity[]): Promise<void>;
  createPickup(pickup: PickupEntity): Promise<string>;
  createInsulin(insulin: InsulinEntity): Promise<string>;
}
