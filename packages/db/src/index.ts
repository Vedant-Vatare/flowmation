import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./db/schema.js";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
	schema,
	casing: "snake_case",
});

export { and, eq, inArray, or, SQL, sql } from "drizzle-orm";
export { DrizzleQueryError } from "drizzle-orm/errors";
export * from "./db/schema.js";
