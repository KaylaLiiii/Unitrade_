import path from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "./schema.js";

let dbInstance = null;

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return url;
}

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(pool, { schema });
  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), "server/drizzle"),
  });

  dbInstance = { db, pool };
  return dbInstance;
}
