import type { PickupEntity } from "domain/entities";
import type {
  PickupRepository,
  getAvailabilitiesTypes,
} from "domain/interfaces/pickup-repository";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { and, gte, lte, sql, eq } from "drizzle-orm";
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
          uuid: crypto.randomUUID(),
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
      const latestAvailabilitiesSubquery = drizzleDb
        .select({
          pickup_id: availabilitiesModel.pickup_id,
          max_checked_at: sql`MAX(${availabilitiesModel.checked_at})`.as(
            "max_checked_at",
          ),
        })
        .from(availabilitiesModel)
        .groupBy(availabilitiesModel.pickup_id)
        .as("latest");

      const [pickupsRows, insulinsRows, latestAvailabilitiesRows] =
        await drizzleDb.batch([
          drizzleDb.select().from(pickupsModel),
          drizzleDb.select().from(insulinsModel),
          drizzleDb
            .select({
              availability: availabilitiesModel,
            })
            .from(availabilitiesModel)
            .innerJoin(
              latestAvailabilitiesSubquery,
              and(
                eq(
                  availabilitiesModel.pickup_id,
                  latestAvailabilitiesSubquery.pickup_id,
                ),
                eq(
                  availabilitiesModel.checked_at,
                  latestAvailabilitiesSubquery.max_checked_at,
                ),
              ),
            ),
        ]);

      const insulinsMap = new Map(insulinsRows.map((ins) => [ins.code, ins]));
      const latestAvailabilitiesMap = new Map(
        latestAvailabilitiesRows.map((row: any) => [
          row.availability.pickup_id,
          row.availability,
        ]),
      );

      const results = pickupsRows.map((pickup) => ({
        pickup,
        availability: latestAvailabilitiesMap.get(pickup.id) || null,
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
