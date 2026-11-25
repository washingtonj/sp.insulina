import { DatabaseSync } from "node:sqlite";
import postgres from "postgres";

type PickupRow = {
  id: number;
  uuid: string;
  name: string;
  address: string;
  business_hours: string;
};

type InsulinRow = {
  id: number;
  code: string;
  name: string;
  simpleName: string;
  type: string;
  variant: string;
};

type AvailabilityRow = {
  id: number;
  pickup_id: number;
  checked_at: string;
  data: string;
};

const IMPORT_CHUNK_SIZE = 1000;

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sqlitePath = args.find((arg) => !arg.startsWith("--"));

if (!sqlitePath) {
  console.error(
    "Usage: npm run db:import -- <path/to/d1.sqlite> [--dry-run]",
  );
  process.exit(1);
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });

const pickups = sqlite
  .prepare("SELECT id, uuid, name, address, business_hours FROM pickups ORDER BY id")
  .all() as PickupRow[];
const insulins = sqlite
  .prepare("SELECT id, code, name, simpleName, type, variant FROM insulins ORDER BY id")
  .all() as InsulinRow[];
const availabilities = sqlite
  .prepare("SELECT id, pickup_id, checked_at, data FROM availabilities ORDER BY id")
  .all() as AvailabilityRow[];
const latestAvailabilities = sqlite
  .prepare("SELECT id, pickup_id, checked_at, data FROM latest_availabilities ORDER BY id")
  .all() as AvailabilityRow[];

sqlite.close();

console.log(
  `D1: ${pickups.length} pickups, ${insulins.length} insulins, ` +
    `${availabilities.length} availabilities, ` +
    `${latestAvailabilities.length} latest availabilities`,
);

if (dryRun) {
  console.log("Dry run: nothing was written.");
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(databaseUrl, { max: 1 });

try {
  await client.begin(async (transaction) => {
    if (pickups.length) {
      await transaction`
        INSERT INTO pickups ${transaction(
          pickups.map((pickup) => ({
            id: pickup.id,
            uuid: pickup.uuid,
            name: pickup.name,
            address: JSON.parse(pickup.address),
            business_hours: JSON.parse(pickup.business_hours),
          })),
          "id",
          "uuid",
          "name",
          "address",
          "business_hours",
        )}
        ON CONFLICT (id) DO UPDATE SET
          uuid = excluded.uuid,
          name = excluded.name,
          address = excluded.address,
          business_hours = excluded.business_hours
      `;
    }

    if (insulins.length) {
      await transaction`
        INSERT INTO insulins ${transaction(
          insulins.map((insulin) => ({
            id: insulin.id,
            code: insulin.code,
            name: insulin.name,
            simple_name: insulin.simpleName,
            type: insulin.type,
            variant: insulin.variant,
          })),
          "id",
          "code",
          "name",
          "simple_name",
          "type",
          "variant",
        )}
        ON CONFLICT (id) DO UPDATE SET
          code = excluded.code,
          name = excluded.name,
          simple_name = excluded.simple_name,
          type = excluded.type,
          variant = excluded.variant
      `;
    }

    for (const rows of chunk(availabilities, IMPORT_CHUNK_SIZE)) {
      await transaction`
        INSERT INTO availabilities ${transaction(
          rows.map((row) => ({
            pickup_id: row.pickup_id,
            checked_at: new Date(row.checked_at),
            data: JSON.parse(row.data),
          })),
          "pickup_id",
          "checked_at",
          "data",
        )}
        ON CONFLICT (pickup_id, checked_at) DO UPDATE SET
          data = excluded.data
      `;
    }

    if (latestAvailabilities.length) {
      await transaction`
        INSERT INTO latest_availabilities ${transaction(
          latestAvailabilities.map((row) => ({
            pickup_id: row.pickup_id,
            checked_at: new Date(row.checked_at),
            data: JSON.parse(row.data),
          })),
          "pickup_id",
          "checked_at",
          "data",
        )}
        ON CONFLICT (pickup_id) DO UPDATE SET
          checked_at = excluded.checked_at,
          data = excluded.data
      `;
    }

    await transaction`
      SELECT setval(
        pg_get_serial_sequence('pickups', 'id'),
        COALESCE((SELECT MAX(id) FROM pickups), 0) + 1,
        false
      )
    `;
    await transaction`
      SELECT setval(
        pg_get_serial_sequence('insulins', 'id'),
        COALESCE((SELECT MAX(id) FROM insulins), 0) + 1,
        false
      )
    `;
  });

  console.log("D1 data imported into Postgres.");
} finally {
  await client.end();
}
