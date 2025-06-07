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
  try {
    const db = drizzle(c.env.MY_DB);
    await updateAvailability({
      pickupRepository: pickupRepositoryWithD1(db),
      pickupService: ESaudeService(),
    });
    return c.text(`Sync completed.pickups updated.`);
  } catch (error) {
    console.error("Error during sync:", error);
    return c.text("An error occurred during the sync process.", 500);
  }
});

app.get("/pickups", async (c) => {
  const db = drizzle(c.env.MY_DB);
  const pickups = await getAllPickups({
    pickupRepository: pickupRepositoryWithD1(db),
  });

  return c.json(pickups);
});

export default app;
