import { PickupEntity } from "domain/entities";

export interface PickupService {
  getPickupsAvailabilities(): Promise<PickupEntity[]>;
}
