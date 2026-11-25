import { sql } from "drizzle-orm";
import type { BestDayRow } from "../../../../domain/interfaces/pickup-repository.ts";
import { type Database, executeRows } from "../../../database.ts";

type Args = {
  startDate: Date;
  endDate: Date;
};

export function selectBestDayProfile(
  db: Database,
  { startDate, endDate }: Args,
): Promise<BestDayRow[]> {
  return executeRows<BestDayRow>(
    db,
    sql`
      WITH readings AS (
        SELECT a.pickup_id AS pickup_id,
               a.checked_at AS checked_at,
               (a.checked_at AT TIME ZONE 'America/Sao_Paulo')::date AS day,
               SUM((j.value->>'quantity')::int) AS units
        FROM availabilities a
        CROSS JOIN LATERAL jsonb_array_elements(a.data) AS j(value)
        JOIN insulins i ON i.code = j.value->>'insulinCode'
        WHERE a.checked_at >= ${startDate.toISOString()}
          AND a.checked_at <= ${endDate.toISOString()}
          AND i.type IN ('REFILL', 'AMPOLA')
        GROUP BY a.pickup_id, a.checked_at, day
      ),
      daily AS (
        SELECT pickup_id, day, units,
               ROW_NUMBER() OVER (
                 PARTITION BY pickup_id, day
                 ORDER BY checked_at DESC
               ) AS position
        FROM readings
      ),
      best_days AS (
        SELECT pickup_id,
               EXTRACT(DAY FROM day)::int AS day_of_month,
               AVG(units) AS average_units,
               COUNT(*)::int AS samples
        FROM daily
        WHERE position = 1
        GROUP BY pickup_id, day_of_month
      ),
      ranked AS (
        SELECT pickup_id, day_of_month, average_units, samples,
               ROW_NUMBER() OVER (
                 PARTITION BY pickup_id
                 ORDER BY average_units DESC, day_of_month
               ) AS place
        FROM best_days
      )
      SELECT p.uuid AS "uuid",
             r.day_of_month AS "dayOfMonth",
             ROUND(r.average_units)::int AS "averageUnits",
             r.samples AS "samples"
      FROM ranked r
      JOIN pickups p ON p.id = r.pickup_id
      WHERE r.place = 1
      ORDER BY p.uuid
    `,
  );
}
