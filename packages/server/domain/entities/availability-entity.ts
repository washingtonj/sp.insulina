import type { InsulinEntity } from "./insulin-entity";
import { type WithoutMethods } from "utils/ts-utils";

export class AvailabilityEntity {
  insulin!: InsulinEntity;
  quantity!: number;
  level!: 1 | 2 | 3;

  constructor(data: WithoutMethods<AvailabilityEntity>) {
    Object.assign(this, data);
  }
}
