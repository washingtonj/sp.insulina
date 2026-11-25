import { Hono, type Context } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import { ESaudeService } from "infrastructure/adapters/e-saude-pickups/service";
import { pickupRepositoryWithD1 } from "infrastructure/adapters/drizzle-d1-pickups/adapter";
import { updateAvailability } from "domain/usecases/sync-availabilities";
import { getAllPickups } from "domain/usecases/get-all-pickups";
import { drizzle } from "drizzle-orm/d1";
import { getAllAvailabilities } from "domain/usecases/get-all-availabilities";
import { getAvailabilitySeries } from "domain/usecases/get-availability-series";
import { getBestDayProfile } from "domain/usecases/get-best-day-profile";
import { fromPickupEntityToDTO } from "presentation/dtos/pickup-dto";

type Bindings = {
  DATABASE: D1Database;
  KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use(logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET"],
  }),
);

const CACHE_ENABLED = true;
const CACHE_ENTRY_TTL_SECONDS = 60 * 60;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_SERIES_DAYS = 30;
const MAX_SERIES_DAYS = 90;

function parseDays(value: string | undefined): number | null {
  if (value === undefined) return DEFAULT_SERIES_DAYS;

  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > MAX_SERIES_DAYS) {
    return null;
  }

  return days;
}

async function getOrSetCache<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (!CACHE_ENABLED) {
    return await fetcher();
  }

  const cached = await kv.get(key, "json");
  const cachedAt = await kv.get(`${key}:CACHED_AT`);
  const now = Date.now();

  // Only return cached if CACHED_AT exists and is less than 30 minutes ago
  if (cached && cachedAt) {
    const cachedTime = new Date(cachedAt).getTime();
    if (now - cachedTime < 30 * 60 * 1000) {
      return cached as T;
    }
  }

  const fresh = await fetcher();
  await kv.put(key, JSON.stringify(fresh), {
    expirationTtl: CACHE_ENTRY_TTL_SECONDS,
  });
  await kv.put(`${key}:CACHED_AT`, new Date().toISOString(), {
    expirationTtl: CACHE_ENTRY_TTL_SECONDS,
  });
  return fresh;
}

function daysOrError(
  c: Context,
): { days: number } | { error: Response } {
  const days = parseDays(c.req.query("days"));

  return days === null
    ? {
        error: c.json(
          { error: `days deve ser um inteiro entre 1 e ${MAX_SERIES_DAYS}` },
          400,
        ),
      }
    : { days };
}

app.get("/", async (c) => {
  const db = drizzle(c.env.DATABASE);
  const kv = c.env.KV;

  const pickups = await getOrSetCache(kv, "PICKUPS_CACHE", async () => {
    const pickups = await getAllPickups({
      pickupRepository: pickupRepositoryWithD1(db),
    });
    return pickups.map(fromPickupEntityToDTO);
  });

  return c.json(pickups);
});

app.get("availabilities", async (c) => {
  const db = drizzle(c.env.DATABASE);
  const kv = c.env.KV;

  const availabilities = await getOrSetCache(
    kv,
    "AVAILABILITIES_CACHE",
    async () => {
      return await getAllAvailabilities({
        pickupRepository: pickupRepositoryWithD1(db),
      });
    },
  );

  return c.json(availabilities);
});

app.get("availabilities/series", async (c) => {
  const resolved = daysOrError(c);
  if ("error" in resolved) return resolved.error;

  const db = drizzle(c.env.DATABASE);

  const series = await getOrSetCache(
    c.env.KV,
    `SERIES_CACHE:${resolved.days}`,
    () =>
      getAvailabilitySeries(
        { pickupRepository: pickupRepositoryWithD1(db) },
        { days: resolved.days },
      ),
  );

  return c.json(series);
});

app.get("pickups/best-days", async (c) => {
  const resolved = daysOrError(c);
  if ("error" in resolved) return resolved.error;

  const db = drizzle(c.env.DATABASE);

  const profile = await getOrSetCache(
    c.env.KV,
    `BEST_DAY_CACHE:${resolved.days}`,
    () =>
      getBestDayProfile(
        { pickupRepository: pickupRepositoryWithD1(db) },
        { days: resolved.days },
      ),
  );

  return c.json(profile);
});

app.get("pickups/:id/availabilities", async (c) => {
  const resolved = daysOrError(c);
  if ("error" in resolved) return resolved.error;

  const pickupId = c.req.param("id");
  if (!UUID_PATTERN.test(pickupId)) {
    return c.json({ error: "pickup inválido" }, 404);
  }

  const db = drizzle(c.env.DATABASE);

  const series = await getOrSetCache(
    c.env.KV,
    `PICKUP_SERIES_CACHE:${pickupId}:${resolved.days}`,
    () =>
      getAvailabilitySeries(
        { pickupRepository: pickupRepositoryWithD1(db) },
        { days: resolved.days, pickupId },
      ),
  );

  return c.json(series);
});

export default {
  fetch: app.fetch,
  scheduled(
    _controller: ScheduledController,
    env: Bindings,
    ctx: ExecutionContext,
  ) {
    async function syncPickups() {
      const db = drizzle(env.DATABASE);
      const pickupService = new ESaudeService();
      const pickupRepository = pickupRepositoryWithD1(db);

      await updateAvailability({
        pickupRepository,
        pickupService,
      });
    }

    ctx.waitUntil(syncPickups());
  },
};
