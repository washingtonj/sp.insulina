import { PickupEntity } from "domain/entities/pickup";
import { PickupRepository } from "domain/interfaces/pickup-repository";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import {
  addressesModel,
  availabilitiesModel,
  businessHoursModel,
  pickupsModel,
  insulinsModel,
} from "./schema";
import { transformPickupsQueryResults } from "./transform";

export function pickupRepositoryWithD1(
  drizzleDb: DrizzleD1Database,
): PickupRepository {
  return {
    async addPickups(pickups: PickupEntity[]): Promise<void> {
      for (const pickup of pickups) {
        const addressId = await drizzleDb
          .insert(addressesModel)
          .values({
            lat: pickup.address.latitude,
            lng: pickup.address.longitude,
            street: pickup.address.address,
          })
          .returning({ id: addressesModel.id });

        const pickupId = await drizzleDb
          .insert(pickupsModel)
          .values({
            address_id: addressId[0].id,
            name: pickup.name,
            uuid: crypto.randomUUID(),
          })
          .returning({ id: pickupsModel.id });

        await drizzleDb.insert(businessHoursModel).values(
          pickup.businessHours.map((businessHour) => ({
            open_time: businessHour.hours[0],
            close_time: businessHour.hours[1],
            day_of_week: businessHour.dayOfWeek,
            pickup_id: pickupId[0].id,
          })),
        );
      }
    },

    async updateAvailabilities(pickups: PickupEntity[]): Promise<void> {
      const pickupsCode = await drizzleDb
        .select({
          id: pickupsModel.id,
          uuid: pickupsModel.uuid,
        })
        .from(pickupsModel);

      const checkDate = new Date().toISOString();
      const availabilitiesToBeAdded = pickups
        .map((pickup) => {
          const pickupDatabaseId = pickupsCode.find(
            (p) => p.uuid === pickup.id,
          );

          if (!pickupDatabaseId) return null;

          const availabilityData = pickup.availability.map((availability) => ({
            insulinCode: availability.insulin.code,
            quantity: availability.quantity,
            level: availability.level,
          }));

          return {
            pickup_id: pickupDatabaseId.id,
            checked_at: checkDate,
            data: JSON.stringify(availabilityData),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const chunkSize = 20;
      const chunks = Array.from(
        { length: Math.ceil(availabilitiesToBeAdded.length / chunkSize) },
        (_, i) =>
          availabilitiesToBeAdded.slice(i * chunkSize, (i + 1) * chunkSize),
      );

      for (const chunk of chunks) {
        await drizzleDb.insert(availabilitiesModel).values(chunk);
      }
    },

    async getAllPickups(): Promise<PickupEntity[]> {
      // 1. Get all pickups with addresses
      const pickupsWithAddresses = await drizzleDb
        .select({
          pickup: pickupsModel,
          address: addressesModel,
        })
        .from(pickupsModel)
        .innerJoin(
          addressesModel,
          eq(pickupsModel.address_id, addressesModel.id),
        );

      // 2. Get all business hours and latest availabilities for those pickups in parallel
      const [businessHours, availabilities] = await drizzleDb.batch([
        drizzleDb.select().from(businessHoursModel),
        drizzleDb.select().from(availabilitiesModel),
      ]);

      // 3. Get all insulins
      const insulins = await drizzleDb.select().from(insulinsModel);

      // Build insulin map
      const insulinMap = new Map(insulins.map((i) => [i.code, i]));

      // Group business hours by pickup_id
      const businessHoursByPickup = new Map();
      businessHours.forEach((bh) => {
        if (!businessHoursByPickup.has(bh.pickup_id))
          businessHoursByPickup.set(bh.pickup_id, []);
        businessHoursByPickup.get(bh.pickup_id).push(bh);
      });

      // Find the latest availability per pickup
      const latestAvailabilities = new Map();
      availabilities.forEach((av) => {
        if (
          !latestAvailabilities.has(av.pickup_id) ||
          latestAvailabilities.get(av.pickup_id).checked_at < av.checked_at
        ) {
          latestAvailabilities.set(av.pickup_id, av);
        }
      });

      // Merge everything for the transformer
      const results = pickupsWithAddresses.map(({ pickup, address }) => ({
        pickup,
        address,
        businessHour: businessHoursByPickup.get(pickup.id) || [],
        availability: latestAvailabilities.get(pickup.id) || null,
      }));

      return transformPickupsQueryResults(results, insulinMap);
    },
  };
}
