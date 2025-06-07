import { Hono } from "hono";
import { logger } from "hono/logger";

import { pickupRepositoryWithD1 } from "infrastructure/adapters/drizzle-d1-pickups/adapter";
import { ESaudeService } from "infrastructure/adapters/e-saude-pickups/service";
import { updateAvailability } from "domain/usecases/sync-availabilities";
import { getAllPickups } from "domain/usecases/get-all-pickups";
import { drizzle } from "drizzle-orm/d1";

type Bindings = {
  MY_DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use(logger());

app.get("/", async (c) => {
  const db = drizzle(c.env.MY_DB);
  const pickups = await getAllPickups({
    pickupRepository: pickupRepositoryWithD1(db),
  });

  return c.json(pickups);
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
      return updateAvailability({
        pickupRepository: pickupRepositoryWithD1(db),
        pickupService: ESaudeService(),
      });
    }

    ctx.waitUntil(syncPickups());
  },
};
