import type { SQLWrapper } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./adapters/postgres-pickups/schema.ts";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export function createDatabase(url: string) {
  const client = postgres(url);

  return { client, db: drizzle(client, { schema }) };
}

/**
 * postgres-js devolve um array de linhas e PGlite devolve `{ rows }`;
 * o genérico do Drizzle apaga o driver, então o formato é resolvido aqui.
 */
export async function executeRows<T extends Record<string, unknown>>(
  db: Database,
  query: SQLWrapper,
): Promise<T[]> {
  const result = (await db.execute<T>(query)) as T[] | { rows: T[] };

  return Array.isArray(result) ? result : result.rows;
}
