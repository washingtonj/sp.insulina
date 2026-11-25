import { serve } from "@hono/node-server";
import { schedule } from "node-cron";

import { updateAvailability } from "./domain/usecases/sync-availabilities.ts";
import { createApp } from "./app.ts";
import { ESaudeService } from "./infrastructure/adapters/e-saude-pickups/service.ts";
import { pickupRepositoryWithPostgres } from "./infrastructure/adapters/postgres-pickups/adapter.ts";
import { createDatabase } from "./infrastructure/database.ts";
import { telemetryConfigFromEnv } from "./telemetry/config.ts";
import { log, logError } from "./telemetry/log.ts";
import { startTelemetry } from "./telemetry/sdk.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const port = Number(process.env.PORT ?? 3000);
const telemetry = startTelemetry(telemetryConfigFromEnv(process.env));
const { db, client } = createDatabase(databaseUrl);
const pickupRepository = pickupRepositoryWithPostgres(db);

const server = serve({ fetch: createApp(db).fetch, port }, (info) => {
  log("info", "server_started", {
    port: info.port,
    telemetry_enabled: telemetry !== null,
  });
});

const syncTask = schedule("0 * * * *", async () => {
  try {
    await updateAvailability({
      pickupRepository,
      pickupService: new ESaudeService(),
    });
  } catch (error) {
    logError("availability_sync_failed", error);
  }
});

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  log("info", "shutdown_started", { signal });
  syncTask.stop();

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    if ("closeIdleConnections" in server) server.closeIdleConnections();
  });

  await telemetry?.shutdown();
  await client.end();

  log("info", "shutdown_finished");
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => void shutdown(signal));
}
