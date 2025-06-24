import type { PickupEntity } from "domain/entities";
import type {
  PickupRepository,
  getAvailabilitiesTypes,
} from "domain/interfaces/pickup-repository";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { and, gte, lte } from "drizzle-orm";
import { pickupsModel, availabilitiesModel, insulinsModel } from "./schema";
import { transformPickupsQueryResults } from "./transform";

export function pickupRepositoryWithD1(
  drizzleDb: DrizzleD1Database,
): PickupRepository {
  return {
    async addPickups(pickups: PickupEntity[]): Promise<void> {
      for (const pickup of pickups) {
        await drizzleDb.insert(pickupsModel).values({
          name: pickup.name,
          uuid: pickup.id ?? crypto.randomUUID(),
          address: JSON.stringify({
            address: pickup.address.address,
            latitude: pickup.address.latitude,
            longitude: pickup.address.longitude,
          }),
          business_hours: JSON.stringify(
            pickup.businessHours.map((bh) => ({
              dayOfWeek: bh.dayOfWeek,
              hours: bh.hours,
            })),
          ),
        });
      }
    },

    async updateAvailabilities(pickups: PickupEntity[]): Promise<void> {
      const pickupsRows = await drizzleDb
        .select({
          id: pickupsModel.id,
          uuid: pickupsModel.uuid,
        })
        .from(pickupsModel);

      const checkDate = new Date().toISOString();
      const availabilitiesToBeAdded = pickups
        .map((pickup) => {
          const pickupDatabaseId = pickupsRows.find(
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
      // Get all pickups
      const pickupsRows = await drizzleDb.select().from(pickupsModel);

      // Get all availabilities
      const availabilities = await drizzleDb.select().from(availabilitiesModel);

      // Get all insulins
      const insulinsRows = await drizzleDb.select().from(insulinsModel);
      const insulinsMap = new Map(insulinsRows.map((ins) => [ins.code, ins]));

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
      const results = pickupsRows.map((pickup) => ({
        pickup,
        availability: latestAvailabilities.get(pickup.id) || null,
      }));

      return transformPickupsQueryResults(results, insulinsMap);
    },

    async getAvailabilities(args) {
      const fromdb = await drizzleDb
        .select({
          pickup_id: availabilitiesModel.pickup_id,
          data: availabilitiesModel.data,
          checked_at: availabilitiesModel.checked_at,
        })
        .from(availabilitiesModel)
        .where(
          and(
            gte(availabilitiesModel.checked_at, args.startDate.toISOString()),
            lte(availabilitiesModel.checked_at, args.endDate.toISOString()),
          ),
        );

      // Map pickup_id to uuid
      const pickupsRows = await drizzleDb.select().from(pickupsModel);
      const idToUuid = new Map(pickupsRows.map((p) => [p.id, p.uuid]));

      return fromdb.reduce((acc, item) => {
        const pickupId = idToUuid.get(item.pickup_id);
        const checkedAt = item.checked_at;
        const data = JSON.parse(item.data);

        if (!pickupId) return acc;

        if (!acc[pickupId]) {
          acc[pickupId] = {};
        }

        acc[pickupId][checkedAt] = data;
        return acc;
      }, {} as any) satisfies getAvailabilitiesTypes["response"];
    },
  };
}
