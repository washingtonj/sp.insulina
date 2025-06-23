import { WithoutMethods } from "utils/ts-utils";
import { AddressEntity } from "./address-entity";
import { AvailabilityEntity } from "./availability-entity";
import { BusinessHourEntity } from "./business-hour-entity";

export class PickupEntity {
  id?: string;
  name!: string;
  address!: AddressEntity;
  availability!: AvailabilityEntity[];
  businessHours!: BusinessHourEntity[];

  constructor(data: WithoutMethods<PickupEntity>) {
    this.id = data.id;
    this.name = data.name;
    this.address = new AddressEntity(data.address);
    this.availability = data.availability.map((a) => new AvailabilityEntity(a));
    this.businessHours = data.businessHours.map(
      (bh) => new BusinessHourEntity(bh),
    );
  }

  withDistance(location: { lat: number; lng: number }): PickupEntity {
    return new PickupEntity({
      ...this,
      address: this.address.withDistance(location),
    });
  }

  is24Hours(): boolean {
    const firstDay = this.businessHours[0];
    if (!firstDay) return false;

    const isOpen24Hours = this.businessHours.every((bh) => {
      const [openTime, closeTime] = bh.hours;
      return openTime === "00:00" && closeTime === "23:59";
    });

    return isOpen24Hours;
  }

  isWeekendOpen(): boolean {
    const weekendDays = [6, 0]; // Saturday = 6, Sunday = 0
    return this.businessHours.some(
      (bh) => weekendDays.includes(bh.dayOfWeek) && bh.hours.length > 0,
    );
  }

  isOpenNow(date = new Date()): boolean {
    // Convert date to São Paulo time (UTC-3)
    const MS_PER_MINUTE = 60 * 1000;
    const MS_PER_HOUR = 60 * MS_PER_MINUTE;
    const UTC_OFFSET_SAO_PAULO = -3; // UTC-3

    const utc = date.getTime() + date.getTimezoneOffset() * MS_PER_MINUTE;
    const saoPauloTime = new Date(utc + MS_PER_HOUR * UTC_OFFSET_SAO_PAULO);

    const dayOfWeek = saoPauloTime.getDay();
    const todayHours = this.businessHours.find(
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

  isSamePickup(toCompare: PickupEntity): boolean {
    return (
      this.name === toCompare.name &&
      this.address.address === toCompare.address.address
    );
  }
}
