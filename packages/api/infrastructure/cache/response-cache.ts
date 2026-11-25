import { eq, sql } from "drizzle-orm";
import { responseCacheModel } from "../adapters/postgres-pickups/schema.ts";
import type { Database } from "../database.ts";
import { traceDbQuery } from "../../telemetry/spans.ts";

const CACHE_TTL_MS = 30 * 60 * 1000;

export async function getOrSetCache<T>(
  db: Database,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const [cached] = await traceDbQuery("SELECT", "response_cache", () =>
    db
      .select()
      .from(responseCacheModel)
      .where(eq(responseCacheModel.key, key))
      .limit(1),
  );

  if (cached && Date.now() - cached.cachedAt.getTime() < CACHE_TTL_MS) {
    return cached.body as T;
  }

  const fresh = await fetcher();

  await traceDbQuery("INSERT", "response_cache", () =>
    db
      .insert(responseCacheModel)
      .values({ key, body: fresh, cachedAt: new Date() })
      .onConflictDoUpdate({
        target: responseCacheModel.key,
        set: {
          body: sql`excluded.body`,
          cachedAt: sql`excluded.cached_at`,
        },
      }),
  );

  return fresh;
}
