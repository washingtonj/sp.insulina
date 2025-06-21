import { PickupEntity } from "domain/entities/pickup";

export type getAvailabilitiesTypes = {
  args: {
    startDate: Date;
    endDate: Date;
  };
  response: {
    pickupId: string;
    availabilities: {
      pickupId: string;
      checkedAt: Date;
      availability: Array<{
        insulinId: string;
        quantity: number;
        level: 1 | 2 | 3;
      }>;
    };
  }[];
};

export interface PickupRepository {
  addPickups(pickups: PickupEntity[]): Promise<void>;
  updateAvailabilities(pickups: PickupEntity[]): Promise<void>;
  getAvailabilities(
    args: getAvailabilitiesTypes["args"],
  ): Promise<getAvailabilitiesTypes["response"]>;
  getAllPickups(): Promise<PickupEntity[]>;
}
