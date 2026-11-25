import { AvailabilityEntity, PickupEntity } from "domain/entities";

export type getAvailabilitiesTypes = {
  args: {
    startDate: Date;
    endDate: Date;
  };
  response: Record<string, { ["checkedAt"]: AvailabilityEntity[] }>;
};

export type AvailabilitySeriesRow = {
  day: string;
  type: string;
  variant: string;
  pickupsWithStock: number;
  totalQuantity: number;
  pickupsReported: number;
};

export type getAvailabilitySeriesTypes = {
  args: {
    startDate: Date;
    endDate: Date;
    pickupId?: string;
  };
  response: AvailabilitySeriesRow[];
};

export type BestDayRow = {
  uuid: string;
  dayOfMonth: number;
  averageUnits: number;
  samples: number;
};

export type getBestDayProfileTypes = {
  args: { startDate: Date; endDate: Date };
  response: BestDayRow[];
};

export interface PickupRepository {
  addPickups(pickups: PickupEntity[]): Promise<void>;
  updateAvailabilities(pickups: PickupEntity[]): Promise<void>;
  getAvailabilities(
    args: getAvailabilitiesTypes["args"],
  ): Promise<getAvailabilitiesTypes["response"]>;
  getAvailabilitySeries(
    args: getAvailabilitySeriesTypes["args"],
  ): Promise<getAvailabilitySeriesTypes["response"]>;
  getBestDayProfile(
    args: getBestDayProfileTypes["args"],
  ): Promise<getBestDayProfileTypes["response"]>;
  getAllPickups(): Promise<PickupEntity[]>;
}
