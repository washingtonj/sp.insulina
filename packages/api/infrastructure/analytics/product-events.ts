import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import type { Database } from "../database.ts";

export const PRODUCT_EVENT_NAMES = [
  "search",
  "filters_applied",
  "pickup_viewed",
  "series_viewed",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];
export type ProductEventProps = Record<string, string | number | boolean>;

export type ProductEvent = {
  name: ProductEventName;
  sessionId: string | null;
  props: ProductEventProps;
};

const MAX_TEXT_LENGTH = 64;
const MAX_PROPS = 8;

export const productEventsModel = pgTable("product_events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  session_id: text("session_id"),
  props: jsonb("props").$type<ProductEventProps>().notNull(),
  occurred_at: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

function isEventName(value: unknown): value is ProductEventName {
  return (
    typeof value === "string" &&
    (PRODUCT_EVENT_NAMES as readonly string[]).includes(value)
  );
}

function isShortText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_TEXT_LENGTH
  );
}

function isPropValue(value: unknown): value is string | number | boolean {
  return (
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    isShortText(value)
  );
}

function isProps(value: unknown): value is ProductEventProps {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const entries = Object.entries(value);

  return (
    entries.length <= MAX_PROPS &&
    entries.every(([key, prop]) => isShortText(key) && isPropValue(prop))
  );
}

/**
 * Events carry no identity: no IP, no user agent, no free text. Only a fixed
 * name, short scalar props and an opaque client session id.
 */
export function parseProductEvent(body: unknown): ProductEvent | null {
  if (typeof body !== "object" || body === null) return null;

  const { name, sessionId, props } = body as Record<string, unknown>;

  if (!isEventName(name)) return null;
  if (sessionId !== undefined && !isShortText(sessionId)) return null;
  if (props !== undefined && !isProps(props)) return null;

  return { name, sessionId: sessionId ?? null, props: props ?? {} };
}

export async function recordProductEvent(
  db: Database,
  event: ProductEvent,
): Promise<void> {
  await db.insert(productEventsModel).values({
    name: event.name,
    session_id: event.sessionId,
    props: event.props,
  });
}
