import { calcDistance } from "utils/distance";

export class AddressEntity {
  address!: string;
  latitude!: number;
  longitude!: number;
  distance?: number;

  constructor(data: Omit<AddressEntity, "withDistance">) {
    Object.assign(this, data);
  }

  withDistance(location: { lat: number; lng: number }): AddressEntity {
    const lat = this.latitude;
    const lng = this.longitude;

    let distance: number | undefined;

    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      !isNaN(location.lat) &&
      !isNaN(location.lng)
    ) {
      distance = calcDistance(location.lat, location.lng, lat, lng);

      // Validate the calculated distance
      if (isNaN(distance) || !isFinite(distance)) {
        distance = undefined;
      } else {
        // Round to 1 decimal place for better UX
        distance = Math.round(distance * 10) / 10;
      }
    }

    return new AddressEntity({
      ...this,
      distance,
    });
  }
}
