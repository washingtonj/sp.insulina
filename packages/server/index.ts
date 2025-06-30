import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import { ESaudeService } from "infrastructure/adapters/e-saude-pickups/service";
import { pickupRepositoryWithD1 } from "infrastructure/adapters/drizzle-d1-pickups/adapter";
import { updateAvailability } from "domain/usecases/sync-availabilities";
import { getAllPickups } from "domain/usecases/get-all-pickups";
import { drizzle } from "drizzle-orm/d1";
import { getAllAvailabilities } from "domain/usecases/get-all-availabilities";
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

const CACHE_ENABLED = false;

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
  await kv.put(key, JSON.stringify(fresh));
  await kv.put(`${key}:CACHED_AT`, new Date().toISOString());
  return fresh;
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
