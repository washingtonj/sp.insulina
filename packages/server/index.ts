import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import { ESaudeService } from "infrastructure/adapters/e-saude-pickups/service";
import { pickupRepositoryWithD1 } from "infrastructure/adapters/drizzle-d1-pickups/adapter";
import { updateAvailability } from "domain/usecases/sync-availabilities";
import { getAllPickups } from "domain/usecases/get-all-pickups";
import { drizzle } from "drizzle-orm/d1";
import { getAllAvailabilities } from "domain/usecases/get-all-availabilities";
import { fromPickupEntityToDTO } from "presentation/pickup-dto";

type Bindings = {
  MY_DB: D1Database;
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

app.get("/", async (c) => {
  const db = drizzle(c.env.MY_DB);
  const pickups = await getAllPickups({
    pickupRepository: pickupRepositoryWithD1(db),
  });

  const pickupsWithFlags = pickups.map(fromPickupEntityToDTO);

  return c.json(pickupsWithFlags);
});

app.get("availabilities", async (c) => {
  const db = drizzle(c.env.MY_DB);
  const availabilities = await getAllAvailabilities({
    pickupRepository: pickupRepositoryWithD1(db),
  });

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
      const db = drizzle(env.MY_DB);
      const pickupService = new ESaudeService();
      const pickupRepository = pickupRepositoryWithD1(db);
      
      return updateAvailability({
        pickupRepository,
        pickupService
      });
    }

    ctx.waitUntil(syncPickups());
  },
};
