import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import {
  type PickupEntity,
  is24Hours,
  isWeekendOpen,
} from "domain/entities/pickup";
import { ESaudeService } from "infrastructure/adapters/e-saude-pickups/service";
import { pickupRepositoryWithD1 } from "infrastructure/adapters/drizzle-d1-pickups/adapter";
import { updateAvailability } from "domain/usecases/sync-availabilities";
import { getAllPickups } from "domain/usecases/get-all-pickups";
import { drizzle } from "drizzle-orm/d1";

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

interface GetResponse extends PickupEntity {
  is24Hours: boolean;
  isWeekendOpen: boolean;
}

app.get("/", async (c) => {
  const db = drizzle(c.env.MY_DB);
  const pickups = await getAllPickups({
    pickupRepository: pickupRepositoryWithD1(db),
  });

  const pickupsWithFlags: GetResponse[] = pickups.map((pickup) => ({
    ...pickup,
    is24Hours: is24Hours(pickup),
    isWeekendOpen: isWeekendOpen(pickup),
  }));

  return c.json(pickupsWithFlags);
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
