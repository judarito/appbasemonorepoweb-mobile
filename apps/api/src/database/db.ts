import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env";

const isSslRequired = env.DATABASE_URL.includes("sslmode=require") || process.env.DB_SSL === "true";

const client = postgres(env.DATABASE_URL, {
  ssl: isSslRequired ? "require" : undefined,
});

export const db = drizzle(client);
export type DbClient = typeof db;
export { client as postgresClient };
