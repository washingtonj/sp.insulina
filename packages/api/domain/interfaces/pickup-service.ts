import type { PickupEntity } from "../entities/index.ts";

export interface PickupService {
  getPickupsAvailabilities(): Promise<PickupEntity[]>;
}
