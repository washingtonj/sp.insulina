import { Hono } from "hono";
import { logger } from "hono/logger";

import { pickupRepositoryWithD1 } from "./repositories/d1-pickups/adapter";
import { ESaudeService } from "./services/e-saude/service";
import { updateAvailability } from "@sp-insulina/core/usecases/sync-availabilities";
import { getAllPickups } from "@sp-insulina/core/usecases/get-all-pickups";

type Bindings = {
  MY_DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use(logger());

app.get("/", async (c) => {
  try {
    await updateAvailability({
      pickupRepository: pickupRepositoryWithD1(c.env.MY_DB),
      pickupService: ESaudeService(),
    });
    return c.text(`Sync completed.pickups updated.`);
  } catch (error) {
    console.error("Error during sync:", error);
    return c.text("An error occurred during the sync process.", 500);
  }
});

app.get("/pickups", async (c) => {
  const pickups = await getAllPickups({
    pickupRepository: pickupRepositoryWithD1(c.env.MY_DB),
  });

  return c.json(pickups);
});

export default app;
