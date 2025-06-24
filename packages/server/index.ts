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

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

async function getOrSetCache<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await kv.get(key, "json");
  const lastSync = await kv.get("LAST_SYNC");
  const now = Date.now();

  // Only return cached if LAST_SYNC exists and is less than 1 hour ago
  if (cached && lastSync) {
    const lastSyncTime = new Date(lastSync).getTime();
    if (now - lastSyncTime < CACHE_TTL) {
      return cached as T;
    }
  }

  const fresh = await fetcher();
  await kv.put(key, JSON.stringify(fresh));
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

      await env.KV.put("LAST_SYNC", new Date().toISOString());
    }

    ctx.waitUntil(syncPickups());
  },
};
