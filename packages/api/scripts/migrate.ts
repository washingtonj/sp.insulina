import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const migrationsUrl = new URL("../infrastructure/migrations/", import.meta.url);
const ddl = readdirSync(migrationsUrl)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(new URL(file, migrationsUrl), "utf8"))
  .join("\n");

const client = postgres(databaseUrl, { max: 1 });

try {
  await client.unsafe(ddl);
  console.log("Postgres schema applied.");
} finally {
  await client.end();
}
