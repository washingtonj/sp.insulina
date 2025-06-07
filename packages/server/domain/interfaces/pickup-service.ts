import { PickupEntity } from "domain/entities/pickup";

export interface PickupService {
  getPickupsAvailabilities(): Promise<PickupEntity[]>;
}
