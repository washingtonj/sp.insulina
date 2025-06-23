import { AvailabilityEntity, PickupEntity } from "domain/entities";

export type getAvailabilitiesTypes = {
  args: {
    startDate: Date;
    endDate: Date;
  };
  response: Record<string, { ["checkedAt"]: AvailabilityEntity[] }>;
};

export interface PickupRepository {
  addPickups(pickups: PickupEntity[]): Promise<void>;
  updateAvailabilities(pickups: PickupEntity[]): Promise<void>;
  getAvailabilities(
    args: getAvailabilitiesTypes["args"],
  ): Promise<getAvailabilitiesTypes["response"]>;
  getAllPickups(): Promise<PickupEntity[]>;
}
