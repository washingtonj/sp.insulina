import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createApp } from "./app.ts";
import { createTestDatabase } from "./test/pglite.ts";
import type { Database } from "./infrastructure/database.ts";
import { telemetryConfigFromEnv } from "./telemetry/config.ts";
import { startTelemetry } from "./telemetry/sdk.ts";

const OTEL_VARIABLES = [
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "OTEL_EXPORTER_OTLP_HEADERS",
  "OTEL_TRACES_SAMPLER",
  "OTEL_SERVICE_NAME",
  "SERVICE_VERSION",
  "DEPLOYMENT_ENVIRONMENT",
] as const;

function saveEnvironment() {
  return Object.fromEntries(
    OTEL_VARIABLES.map((name) => [name, process.env[name]]),
  );
}

function restoreEnvironment(saved: Record<string, string | undefined>): void {
  for (const [name, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

function startFakeCollector() {
  const payloads: Buffer[] = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      payloads.push(Buffer.concat(chunks));
      response.writeHead(200, { "content-type": "application/x-protobuf" });
      response.end();
    });
  });

  return new Promise<{ server: Server; payloads: Buffer[]; url: string }>(
    (resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address() as AddressInfo;
        resolve({ server, payloads, url: `http://127.0.0.1:${port}` });
      });
    },
  );
}

describe("otlp export", () => {
  let client: PGlite;
  let db: Database;
  let collector: Awaited<ReturnType<typeof startFakeCollector>>;
  let saved: Record<string, string | undefined>;
  let telemetry: ReturnType<typeof startTelemetry>;

  beforeAll(async () => {
    saved = saveEnvironment();
    collector = await startFakeCollector();

    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = collector.url;
    process.env.OTEL_TRACES_SAMPLER = "always_on";
    process.env.OTEL_SERVICE_NAME = "sp-insulina-api";
    process.env.SERVICE_VERSION = "9.9.9";
    process.env.DEPLOYMENT_ENVIRONMENT = "test";

    telemetry = startTelemetry(telemetryConfigFromEnv(process.env));
    ({ client, db } = await createTestDatabase());
  });

  afterAll(async () => {
    await telemetry?.shutdown();
    await client.close();
    await new Promise<void>((resolve) => collector.server.close(() => resolve()));
    restoreEnvironment(saved);
  });

  it("sends http, usecase and database spans to the collector", async () => {
    expect(telemetry).not.toBeNull();

    const app = createApp(db);
    const response = await app.request("/availabilities/series?days=3");
    expect(response.status).toBe(200);

    await telemetry?.shutdown();
    telemetry = null;

    const payload = Buffer.concat(collector.payloads).toString("utf8");

    expect(payload).toContain("service.name");
    expect(payload).toContain("sp-insulina-api");
    expect(payload).toContain("9.9.9");
    expect(payload).toContain("GET /availabilities/series");
    expect(payload).toContain("availability.series");
    expect(payload).toContain("SELECT availabilities");
    expect(payload).toContain("SELECT response_cache");
  });
});

describe("telemetry disabled", () => {
  it("stays off when no OTLP endpoint is configured", () => {
    const config = telemetryConfigFromEnv({});

    expect(config).toEqual({
      serviceName: "sp-insulina-api",
      serviceVersion: "0.0.0-dev",
      environment: "development",
      enabled: false,
    });
    expect(startTelemetry(config)).toBeNull();
  });

  it("enables traces when only the signal-specific endpoint is set", () => {
    const config = telemetryConfigFromEnv({
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "http://localhost:4318/v1/traces",
      NODE_ENV: "production",
    });

    expect(config.enabled).toBe(true);
    expect(config.environment).toBe("production");
  });
});
