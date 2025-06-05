import { Hono } from "hono";
import { D1Pickups } from "./repositories/d1-pickups/adapter";
import { ESaudeService } from "./services/e-saude/service";
import { updateAvailability } from "@sp-insulina/core/usecases/sync-availabilities";

type Bindings = {
  MY_DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const pickups = await updateAvailability({
    pickupRepository: D1Pickups(c.env.MY_DB),
    pickupService: ESaudeService(),
  });

  return c.json(pickups, 200);
});

export default app;
