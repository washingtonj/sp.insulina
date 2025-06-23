import { WithoutMethods } from "utils/ts-utils";

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export class BusinessHourEntity {
  dayOfWeek!: DayOfWeek;
  hours!: [string, string]; // [openTime, closeTime] in 24h format

  constructor(data: WithoutMethods<BusinessHourEntity>) {
    Object.assign(this, data);
  }
}
