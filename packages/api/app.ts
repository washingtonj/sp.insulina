import { httpInstrumentationMiddleware } from "@hono/otel";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

import { getAllAvailabilities } from "./domain/usecases/get-all-availabilities.ts";
import { getAllPickups } from "./domain/usecases/get-all-pickups.ts";
import { getAvailabilitySeries } from "./domain/usecases/get-availability-series.ts";
import { getBestDayProfile } from "./domain/usecases/get-best-day-profile.ts";
import {
  parseProductEvent,
  recordProductEvent,
} from "./infrastructure/analytics/product-events.ts";
import { pickupRepositoryWithPostgres } from "./infrastructure/adapters/postgres-pickups/adapter.ts";
import { getOrSetCache } from "./infrastructure/cache/response-cache.ts";
import type { Database } from "./infrastructure/database.ts";
import { telemetryConfigFromEnv } from "./telemetry/config.ts";
import { log, logError } from "./telemetry/log.ts";
import { createMetrics } from "./telemetry/metrics.ts";
import { fromPickupEntityToDTO } from "./presentation/dtos/pickup-dto.ts";

const DEFAULT_SERIES_DAYS = 30;
const MAX_SERIES_DAYS = 90;
const MAX_EVENT_BODY_BYTES = 4 * 1024;
const MAX_REQUEST_ID_LENGTH = 64;

type AppEnv = {
  Variables: {
    requestId: string;
  };
};

function parseDays(value: string | undefined): number | null {
  if (value === undefined) return DEFAULT_SERIES_DAYS;

  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > MAX_SERIES_DAYS) {
    return null;
  }

  return days;
}

function requestIdFrom(header: string | undefined): string {
  if (header !== undefined && header.length <= MAX_REQUEST_ID_LENGTH) {
    return header;
  }

  return crypto.randomUUID();
}

function daysOrError(
  c: Context<AppEnv>,
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

export function createApp(db: Database) {
  const app = new Hono<AppEnv>();
  const pickupRepository = pickupRepositoryWithPostgres(db);
  const metrics = createMetrics();
  const config = telemetryConfigFromEnv(process.env);

  app.use(
    "*",
    httpInstrumentationMiddleware({
      serviceName: config.serviceName,
      serviceVersion: config.serviceVersion,
    }),
  );

  app.use("*", async (c, next) => {
    const requestId = requestIdFrom(c.req.header("x-request-id"));
    const startedAt = performance.now();
    c.set("requestId", requestId);
    c.header("x-request-id", requestId);

    try {
      await next();
    } finally {
      const seconds = (performance.now() - startedAt) / 1000;
      const route = c.res.status === 404 ? "unmatched" : c.req.routePath;

      metrics.observeRequest(c.req.method, route, c.res.status, seconds);
      log("info", "http_request", {
        request_id: requestId,
        method: c.req.method,
        path: c.req.path,
        route,
        status: c.res.status,
        duration_ms: Math.round(seconds * 1000),
      });
    }
  });

  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST"],
      allowHeaders: ["Content-Type"],
    }),
  );

  app.onError((error, c) => {
    if (error instanceof HTTPException) return error.getResponse();

    logError("request_failed", error, {
      request_id: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
    });

    return c.json({ error: "erro interno" }, 500);
  });

  app.get("/health", (c) =>
    c.json({ status: "ok", version: config.serviceVersion }),
  );

  app.get("/metrics", (c) =>
    c.body(metrics.render(), 200, {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
    }),
  );

  app.post(
    "/events",
    bodyLimit({ maxSize: MAX_EVENT_BODY_BYTES }),
    async (c) => {
      const event = parseProductEvent(await c.req.json().catch(() => null));

      if (!event) return c.json({ error: "evento inválido" }, 400);

      await recordProductEvent(db, event);

      return c.body(null, 204);
    },
  );

  app.get("/", async (c) => {
    const pickups = await getOrSetCache(db, "PICKUPS_CACHE", async () => {
      const pickups = await getAllPickups({ pickupRepository });
      return pickups.map(fromPickupEntityToDTO);
    });

    return c.json(pickups);
  });

  app.get("/availabilities", async (c) => {
    const availabilities = await getOrSetCache(
      db,
      "AVAILABILITIES_CACHE",
      () => getAllAvailabilities({ pickupRepository }),
    );

    return c.json(availabilities);
  });

  app.get("/availabilities/series", async (c) => {
    const resolved = daysOrError(c);
    if ("error" in resolved) return resolved.error;

    const series = await getOrSetCache(
      db,
      `SERIES_CACHE:${resolved.days}`,
      () =>
        getAvailabilitySeries(
          { pickupRepository },
          { days: resolved.days },
        ),
    );

    return c.json(series);
  });

  app.get("/pickups/best-days", async (c) => {
    const resolved = daysOrError(c);
    if ("error" in resolved) return resolved.error;

    const profile = await getOrSetCache(db, `BEST_DAY_CACHE:${resolved.days}`, () =>
      getBestDayProfile({ pickupRepository }, { days: resolved.days }),
    );

    return c.json(profile);
  });

  app.get("/pickups/:id/availabilities", async (c) => {
    const resolved = daysOrError(c);
    if ("error" in resolved) return resolved.error;

    const pickupId = c.req.param("id");
    const series = await getOrSetCache(
      db,
      `PICKUP_SERIES_CACHE:${pickupId}:${resolved.days}`,
      () =>
        getAvailabilitySeries(
          { pickupRepository },
          { days: resolved.days, pickupId },
        ),
    );

    return c.json(series);
  });

  return app;
}
