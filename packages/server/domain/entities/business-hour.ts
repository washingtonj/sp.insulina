export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BusinessHourEntity {
  dayOfWeek: DayOfWeek;
  hours: [string, string]; // [openTime, closeTime] in 24h format
  isOpen?: boolean;
}

/**
 * Checks if the business operates 24 hours a day, 7 days a week.
 * A 24h service is defined as being open every day with hours from "00:00" to "23:59".
 * @param businessHours Array of business hour entities for each day.
 * @returns True if the business is open 24/7, false otherwise.
 */
export function has24hService(businessHours: BusinessHourEntity[]): boolean {
  const openDays = businessHours.filter((day) => day.isOpen);
  if (openDays.length !== 7) return false;

  return openDays.every(
    (day) => day.hours[0] === "00:00" && day.hours[1] === "23:59",
  );
}

/**
 * Checks if the business is open on weekends (Saturday or Sunday).
 * @param businessHours Array of business hour entities for each day.
 * @returns True if open on either Saturday (6) or Sunday (0), false otherwise.
 */
export function hasWeekendService(
  businessHours: BusinessHourEntity[],
): boolean {
  return businessHours.some(
    (day) => day.isOpen && (day.dayOfWeek === 0 || day.dayOfWeek === 6),
  );
}

/**
 * Checks if the business is open on any weekday (Monday to Friday).
 * @param businessHours Array of business hour entities for each day.
 * @returns True if open on any day from Monday (1) to Friday (5), false otherwise.
 */
export function hasWeekdayService(
  businessHours: BusinessHourEntity[],
): boolean {
  return businessHours.some(
    (day) => day.isOpen && day.dayOfWeek >= 1 && day.dayOfWeek <= 5,
  );
}

/**
 * Checks if the pickup is open now in São Paulo timezone (UTC-3).
 * @param businessHours The business hours array for the pickup.
 * @param date The current date (server time, assumed UTC or local).
 * @returns true if open now, false otherwise.
 */
export function isOpenNow(
  businessHours: BusinessHourEntity[],
  date: Date,
): boolean {
  // Convert date to São Paulo time (UTC-3)
  const MS_PER_MINUTE = 60 * 1000;
  const MS_PER_HOUR = 60 * MS_PER_MINUTE;
  const UTC_OFFSET_SAO_PAULO = -3; // UTC-3

  const utc = date.getTime() + date.getTimezoneOffset() * MS_PER_MINUTE;
  const saoPauloTime = new Date(utc + MS_PER_HOUR * UTC_OFFSET_SAO_PAULO);

  const dayOfWeek = saoPauloTime.getDay() as DayOfWeek;
  const todayHours = businessHours.find((bh) => bh.dayOfWeek === dayOfWeek);

  if (!todayHours || !todayHours.isOpen) return false;

  const [openTime, closeTime] = todayHours.hours;

  // Parse open and close times as São Paulo time
  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  const openDate = new Date(saoPauloTime);
  openDate.setHours(openHour, openMinute, 0, 0);

  const closeDate = new Date(saoPauloTime);
  closeDate.setHours(closeHour, closeMinute, 0, 0);

  // Handle overnight (close time past midnight)
  if (closeDate <= openDate) {
    // If now is after open or before close (overnight)
    return saoPauloTime >= openDate || saoPauloTime <= closeDate;
  }

  return saoPauloTime >= openDate && saoPauloTime <= closeDate;
}
