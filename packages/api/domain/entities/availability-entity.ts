import type { InsulinEntity } from "./insulin-entity.ts";
import { type WithoutMethods } from "../../utils/ts-utils.ts";

export type AvailabilitySnapshot = {
  insulinCode: string;
  quantity: number;
  level: 1 | 2 | 3;
};

export class AvailabilityEntity {
  insulin!: InsulinEntity;
  quantity!: number;
  level!: 1 | 2 | 3;

  constructor(data: WithoutMethods<AvailabilityEntity>) {
    Object.assign(this, data);
  }
}
