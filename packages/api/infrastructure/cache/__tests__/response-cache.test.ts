import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDatabase, resetDatabase } from "../../../test/pglite.ts";
import type { Database } from "../../database.ts";
import { getOrSetCache } from "../response-cache.ts";
import { responseCacheModel } from "../../adapters/postgres-pickups/schema.ts";

describe("getOrSetCache", () => {
  let client: PGlite;
  let db: Database;

  beforeAll(async () => {
    ({ client, db } = await createTestDatabase());
  });

  beforeEach(async () => {
    await resetDatabase(client);
  });

  afterAll(async () => {
    await client.close();
  });

  it("stores the first result and serves it from cache", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });

    const first = await getOrSetCache(db, "CACHE_KEY", fetcher);
    const second = await getOrSetCache(db, "CACHE_KEY", fetcher);

    expect(first).toEqual({ value: 1 });
    expect(second).toEqual({ value: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    const rows = await db.select().from(responseCacheModel);
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("CACHE_KEY");
    expect(rows[0].body).toEqual({ value: 1 });
  });

  it("keeps different keys apart", async () => {
    const first = vi.fn().mockResolvedValue("first");
    const second = vi.fn().mockResolvedValue("second");

    expect(await getOrSetCache(db, "KEY_A", first)).toBe("first");
    expect(await getOrSetCache(db, "KEY_B", second)).toBe("second");
    expect(await getOrSetCache(db, "KEY_A", first)).toBe("first");

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("refetches and overwrites the row after 30 minutes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-24T20:00:00.000Z"));

    try {
      const fetcher = vi.fn().mockResolvedValueOnce("old").mockResolvedValueOnce("new");

      expect(await getOrSetCache(db, "CACHE_KEY", fetcher)).toBe("old");

      vi.setSystemTime(new Date("2026-11-24T20:29:59.999Z"));
      expect(await getOrSetCache(db, "CACHE_KEY", fetcher)).toBe("old");
      expect(fetcher).toHaveBeenCalledTimes(1);

      vi.setSystemTime(new Date("2026-11-24T20:30:00.000Z"));
      expect(await getOrSetCache(db, "CACHE_KEY", fetcher)).toBe("new");
      expect(fetcher).toHaveBeenCalledTimes(2);

      const rows = await db.select().from(responseCacheModel);
      expect(rows).toHaveLength(1);
      expect(rows[0].body).toBe("new");
    } finally {
      vi.useRealTimers();
    }
  });
});
