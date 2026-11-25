import { and, gte, lte, sql } from "drizzle-orm";
import type { PickupEntity } from "../../../domain/entities/index.ts";
import type {
  PickupRepository,
  getAvailabilitiesTypes,
} from "../../../domain/interfaces/pickup-repository.ts";
import type { Database } from "../../database.ts";
import { traceDbQuery } from "../../../telemetry/spans.ts";
import {
  availabilitiesModel,
  insulinsModel,
  lastAvailabilitiesModel,
  pickupsModel,
} from "./schema.ts";
import {
  type PickupQueryResult,
  type StoredInsulin,
  transformPickupsQueryResults,
} from "./transform.ts";
import { selectAvailabilitySeries } from "./queries/availability-series.ts";
import { selectBestDayProfile } from "./queries/best-days.ts";

export function pickupRepositoryWithPostgres(db: Database): PickupRepository {
  return {
    async addPickups(pickups: PickupEntity[]): Promise<void> {
      if (!pickups.length) return;

      await db.insert(pickupsModel).values(
        pickups.map((pickup) => ({
          uuid: crypto.randomUUID(),
          name: pickup.name,
          address: {
            address: pickup.address.address,
            latitude: pickup.address.latitude,
            longitude: pickup.address.longitude,
          },
          business_hours: pickup.businessHours.map((businessHour) => ({
            dayOfWeek: businessHour.dayOfWeek,
            hours: businessHour.hours,
          })),
        })),
      );
    },

    async updateAvailabilities(pickups: PickupEntity[]): Promise<void> {
      if (!pickups.length) return;

      const checkedAt = new Date();
      const pickupsRows = await db
        .select({ id: pickupsModel.id, uuid: pickupsModel.uuid })
        .from(pickupsModel);
      const idByUuid = new Map(pickupsRows.map((row) => [row.uuid, row.id]));

      const availabilityRows = pickups.flatMap((pickup) => {
        const pickupId = pickup.id ? idByUuid.get(pickup.id) : undefined;
        if (pickupId === undefined) return [];

        return [
          {
            pickup_id: pickupId,
            checked_at: checkedAt,
            data: pickup.availability.map((availability) => ({
              insulinCode: availability.insulin.code,
              quantity: availability.quantity,
              level: availability.level,
            })),
          },
        ];
      });

      if (!availabilityRows.length) return;

      await traceDbQuery("INSERT", "availabilities", () =>
        db.transaction(async (tx) => {
          await tx
            .insert(availabilitiesModel)
            .values(availabilityRows)
            .onConflictDoUpdate({
              target: [
                availabilitiesModel.pickup_id,
                availabilitiesModel.checked_at,
              ],
              set: { data: sql`excluded.data` },
            });

          await tx
            .insert(lastAvailabilitiesModel)
            .values(availabilityRows)
            .onConflictDoUpdate({
              target: [lastAvailabilitiesModel.pickup_id],
              set: {
                checked_at: sql`excluded.checked_at`,
                data: sql`excluded.data`,
              },
            });
        }),
      );
    },

    async getAllPickups(): Promise<PickupEntity[]> {
      const [pickupsRows, insulinsRows, latestAvailabilitiesRows] =
        await traceDbQuery("SELECT", "pickups", () =>
          db.transaction(async (tx) => {
            const pickupsRows = await tx
              .select()
              .from(pickupsModel)
              .orderBy(pickupsModel.id);
            const insulinsRows = await tx.select().from(insulinsModel);
            const latestAvailabilitiesRows = await tx
              .select()
              .from(lastAvailabilitiesModel);

            return [pickupsRows, insulinsRows, latestAvailabilitiesRows] as const;
          }),
        );

      const insulinsMap = new Map<string, StoredInsulin>(
        insulinsRows.map((insulin) => [insulin.code, insulin]),
      );
      const latestAvailabilitiesMap = new Map(
        latestAvailabilitiesRows.map((row) => [row.pickup_id, row]),
      );

      const results: PickupQueryResult[] = pickupsRows.map((pickup) => ({
        pickup,
        availability: latestAvailabilitiesMap.get(pickup.id) ?? null,
      }));

      return transformPickupsQueryResults(results, insulinsMap);
    },

    async getAvailabilities(
      args,
    ): Promise<getAvailabilitiesTypes["response"]> {
      const rows = await traceDbQuery("SELECT", "availabilities", () =>
        db
          .select({
            pickup_id: availabilitiesModel.pickup_id,
            data: availabilitiesModel.data,
            checked_at: availabilitiesModel.checked_at,
          })
          .from(availabilitiesModel)
          .where(
            and(
              gte(availabilitiesModel.checked_at, args.startDate),
              lte(availabilitiesModel.checked_at, args.endDate),
            ),
          ),
      );

      const pickupsRows = await db
        .select({ id: pickupsModel.id, uuid: pickupsModel.uuid })
        .from(pickupsModel);
      const idToUuid = new Map(pickupsRows.map((row) => [row.id, row.uuid]));

      const availabilities: getAvailabilitiesTypes["response"] = {};

      for (const row of rows) {
        const pickupUuid = idToUuid.get(row.pickup_id);
        if (!pickupUuid) continue;

        availabilities[pickupUuid] ??= {};
        availabilities[pickupUuid][row.checked_at.toISOString()] = row.data;
      }

      return availabilities;
    },

    async getAvailabilitySeries(args) {
      return traceDbQuery("SELECT", "availabilities", () =>
        selectAvailabilitySeries(db, args),
      );
    },

    async getBestDayProfile(args) {
      return traceDbQuery("SELECT", "availabilities", () =>
        selectBestDayProfile(db, args),
      );
    },
  };
}
