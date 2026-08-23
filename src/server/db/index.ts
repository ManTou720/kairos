import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type KairosDb = PostgresJsDatabase<typeof schema>;

// Cache across hot reloads / lambda invocations on the same instance.
const cache = globalThis as unknown as {
  __kairosConn?: postgres.Sql;
  __kairosDb?: KairosDb;
};

function getDb(): KairosDb {
  if (!cache.__kairosDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    // Serverless-friendly settings:
    // - max: 1 — each lambda keeps a single connection.
    // - prepare: false — required when connecting through PgBouncer in
    //   transaction mode (Neon's pooled connection strings).
    cache.__kairosConn = postgres(connectionString, {
      max: 1,
      prepare: false,
    });
    cache.__kairosDb = drizzle(cache.__kairosConn, { schema });
  }
  return cache.__kairosDb;
}

/**
 * Lazily-proxied Drizzle instance. Importing this module never opens a
 * connection, so `next build` succeeds without DATABASE_URL (the throw
 * happens on first actual query instead of at import time).
 */
export const db: KairosDb = new Proxy(
  {},
  {
    get: (_target, prop, receiver) =>
      Reflect.get(getDb() as object, prop, receiver),
  }
) as KairosDb;
