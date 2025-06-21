export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BusinessHourEntity {
  dayOfWeek: DayOfWeek;
  hours: [string, string]; // [openTime, closeTime] in 24h format
}
