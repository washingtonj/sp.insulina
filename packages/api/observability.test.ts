import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createApp } from "./app.ts";
import { createTestDatabase, resetDatabase } from "./test/pglite.ts";
import type { Database } from "./infrastructure/database.ts";
import {
  parseProductEvent,
  productEventsModel,
} from "./infrastructure/analytics/product-events.ts";

describe("operational endpoints", () => {
  let client: PGlite;
  let db: Database;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    process.env.SERVICE_VERSION = "1.2.3";
    ({ client, db } = await createTestDatabase());
  });

  beforeEach(async () => {
    await resetDatabase(client);
    app = createApp(db);
  });

  afterAll(async () => {
    await client.close();
    delete process.env.SERVICE_VERSION;
  });

  it("reports liveness with the deployed version", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", version: "1.2.3" });
  });

  it("exports Prometheus counters and latency histograms", async () => {
    await app.request("/health");
    await app.request("/missing");
    await app.request("/");

    const body = await (await app.request("/metrics")).text();

    expect(body).toContain("# TYPE http_requests_total counter");
    expect(body).toContain(
      'http_requests_total{method="GET",route="/health",status="200"} 1',
    );
    expect(body).toContain(
      'http_requests_total{method="GET",route="unmatched",status="404"} 1',
    );
    expect(body).toContain(
      'http_requests_total{method="GET",route="/",status="200"} 1',
    );
    expect(body).toContain("# TYPE http_request_duration_seconds histogram");
    expect(body).toContain('http_request_duration_seconds_bucket{method="GET",route="/",status="200",le="+Inf"} 1');
  });

  it("accepts known product events without storing identity", async () => {
    const response = await app.request("/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "series_viewed",
        sessionId: "session-123",
        props: { days: 30, scope: "network" },
      }),
    });

    expect(response.status).toBe(204);

    const [event] = await db.select().from(productEventsModel);
    expect(event).toMatchObject({
      name: "series_viewed",
      session_id: "session-123",
      props: { days: 30, scope: "network" },
    });
  });

  it("rejects unknown event names and out-of-shape props", async () => {
    const invalidBodies = [
      { name: "page_view" },
      { name: "search", props: { query: "x".repeat(65) } },
      { name: "search", props: Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`key-${index}`, index])) },
      { name: "search", props: { nested: { value: 1 } } },
      { name: "search", sessionId: "" },
    ];

    for (const body of invalidBodies) {
      const response = await app.request("/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(400);
    }

    const [stored] = await db.select().from(productEventsModel);
    expect(stored).toBeUndefined();
  });

  it("drops oversized event payloads", async () => {
    const response = await app.request("/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "search", props: { text: "x".repeat(5000) } }),
    });

    expect(response.status).toBe(413);
  });

  it("answers 400 for malformed JSON", async () => {
    const response = await app.request("/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(400);
  });

  it("keeps the stored event timestamp from the database", async () => {
    await app.request("/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "search" }),
    });

    const [event] = await db.select().from(productEventsModel);
    expect(event.occurred_at).toBeInstanceOf(Date);
    expect(event.props).toEqual({});
  });
});

describe("product event parsing", () => {
  it("accepts only the fixed event vocabulary", () => {
    expect(parseProductEvent({ name: "pickup_viewed" })).toEqual({
      name: "pickup_viewed",
      sessionId: null,
      props: {},
    });
    expect(parseProductEvent({ name: "click" })).toBeNull();
    expect(parseProductEvent(null)).toBeNull();
  });
});
