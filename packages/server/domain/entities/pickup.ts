import { type AddressEntity, addDistance } from "./address";
import type { AvailabilityEntity } from "./availability";
import type { BusinessHourEntity } from "./business-hour";

export interface PickupEntity {
  id?: string;
  name: string;
  address: AddressEntity;
  availability: AvailabilityEntity[];
  businessHours: BusinessHourEntity[];
}

/**
 * Calculates the distance from a given location to the pickup's address,
 * and returns a new PickupEntity with the address updated to include distance information.
 *
 * @param pickup - The PickupEntity whose address will be updated with distance.
 * @param location - An object containing latitude and longitude to calculate distance from.
 * @returns A new PickupEntity with the address property updated to include distance.
 */
export function calcPickupDistance(
  pickup: PickupEntity,
  location: { lat: number; lng: number },
): PickupEntity {
  const addressWithDistance = addDistance(pickup.address, location);
  return { ...pickup, address: addressWithDistance };
}

/**
 * Checks if the pickup is open 24 hours based on its business hours.
 * A pickup is considered open 24 hours if all days have the same open and close times
 * of "00:00" to "23:59".
 *
 * @param businessHours - The business hours array for the pickup.
 * @returns true if open 24 hours, false otherwise.
 */
export function is24Hours(pickup: PickupEntity): boolean {
  // Check if all days have the same open and close times
  const firstDay = pickup.businessHours[0];
  if (!firstDay) return false;

  const isOpen24Hours = pickup.businessHours.every((bh) => {
    const [openTime, closeTime] = bh.hours;
    return openTime === "00:00" && closeTime === "23:59";
  });

  return isOpen24Hours;
}

/**
 * Checks if the pickup is open on weekends (Saturday and Sunday).
 * A pickup is considered open on weekends if it has business hours defined for either Saturday or Sunday.
 *
 * @param pickup - The PickupEntity to check.
 * @returns true if open on weekends, false otherwise.
 */
export function isWeekendOpen(pickup: PickupEntity): boolean {
  // Check if the pickup is open on weekends (Saturday and Sunday)
  const weekendDays = [6, 0]; // Saturday = 6, Sunday = 0
  return pickup.businessHours.some(
    (bh) => weekendDays.includes(bh.dayOfWeek) && bh.hours.length > 0,
  );
}

/**
 * Determines if two pickup objects represent the same pickup location,
 * based on their name and address string.
 *
 * @param a - The first pickup object to compare.
 * @param b - The second pickup object to compare.
 * @returns True if both pickups have the same name and address, false otherwise.
 */
export function isSamePickup(
  a: { name: string; address: { address: string } },
  b: { name: string; address: { address: string } },
) {
  return a.name === b.name && a.address.address === b.address.address;
}

/**
 * Checks if the pickup is open now in São Paulo timezone (UTC-3).
 * @param businessHours The business hours array for the pickup.
 * @param date The current date (server time, assumed UTC or local).
 * @returns true if open now, false otherwise.
 */
export function isOpenNow(pickup: PickupEntity, date = new Date()): boolean {
  // Convert date to São Paulo time (UTC-3)
  const MS_PER_MINUTE = 60 * 1000;
  const MS_PER_HOUR = 60 * MS_PER_MINUTE;
  const UTC_OFFSET_SAO_PAULO = -3; // UTC-3

  const utc = date.getTime() + date.getTimezoneOffset() * MS_PER_MINUTE;
  const saoPauloTime = new Date(utc + MS_PER_HOUR * UTC_OFFSET_SAO_PAULO);

  const dayOfWeek = saoPauloTime.getDay();
  const todayHours = pickup.businessHours.find(
    (bh) => bh.dayOfWeek === dayOfWeek,
  );

  if (!todayHours) return false;

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
