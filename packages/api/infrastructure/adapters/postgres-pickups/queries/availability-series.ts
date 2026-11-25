import { sql } from "drizzle-orm";
import type { AvailabilitySeriesRow } from "../../../../domain/interfaces/pickup-repository.ts";
import { type Database, executeRows } from "../../../database.ts";

type Args = {
  startDate: Date;
  endDate: Date;
  pickupId?: string;
};

export function selectAvailabilitySeries(
  db: Database,
  { startDate, endDate, pickupId }: Args,
): Promise<AvailabilitySeriesRow[]> {
  const pickupFilter = pickupId ? sql`AND p.uuid = ${pickupId}` : sql``;

  return executeRows<AvailabilitySeriesRow>(
    db,
    sql`
      WITH ranked AS (
        SELECT a.pickup_id AS pickup_id,
               to_char(a.checked_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day,
               a.data AS data,
               ROW_NUMBER() OVER (
                 PARTITION BY a.pickup_id, (a.checked_at AT TIME ZONE 'America/Sao_Paulo')::date
                 ORDER BY a.checked_at DESC
               ) AS position
        FROM availabilities a
        JOIN pickups p ON p.id = a.pickup_id
        WHERE a.checked_at >= ${startDate.toISOString()}
          AND a.checked_at <= ${endDate.toISOString()}
          ${pickupFilter}
      )
      SELECT r.day AS day,
             i.type AS type,
             i.variant AS variant,
             COUNT(*) FILTER (WHERE (j.value->>'quantity')::int > 0)::int AS "pickupsWithStock",
             COALESCE(SUM((j.value->>'quantity')::int), 0)::int AS "totalQuantity",
             COUNT(*)::int AS "pickupsReported"
      FROM ranked r
      CROSS JOIN LATERAL jsonb_array_elements(r.data) AS j(value)
      JOIN insulins i ON i.code = j.value->>'insulinCode'
      WHERE r.position = 1
      GROUP BY r.day, i.type, i.variant
      ORDER BY r.day, i.type, i.variant
    `,
  );
}
