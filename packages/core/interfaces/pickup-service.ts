import { PickupEntity } from "$core/entities/pickup";

export interface PickupService {
  getPickupsAvailabilities(): Promise<PickupEntity[]>;
}
