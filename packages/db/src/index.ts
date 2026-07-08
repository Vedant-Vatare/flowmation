import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./db/schema.js";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 20,
	connectionTimeoutMillis: 5000,
	idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, {
	schema,
	casing: "snake_case",
});

export { and, desc, eq, inArray, not, or, SQL, sql } from "drizzle-orm";
export { DrizzleQueryError } from "drizzle-orm/errors";
export * from "./db/schema.js";
