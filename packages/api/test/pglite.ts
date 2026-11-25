import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../infrastructure/adapters/postgres-pickups/schema.ts";

const migrationsUrl = new URL("../infrastructure/migrations/", import.meta.url);
const ddl = readdirSync(migrationsUrl)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(new URL(file, migrationsUrl), "utf8"))
  .join("\n");

export async function createTestDatabase() {
  const client = new PGlite();
  await client.exec(ddl);

  return { client, db: drizzle(client, { schema }) };
}

export async function resetDatabase(client: PGlite): Promise<void> {
  await client.exec(
    "TRUNCATE pickups, insulins, availabilities, latest_availabilities, response_cache, product_events RESTART IDENTITY CASCADE",
  );
}
